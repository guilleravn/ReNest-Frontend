import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '@/lib/api'
import { getMe, logout, type Me } from '@/lib/auth'
import { expireSession, getToken, getTokenExpiry, onSessionExpired } from '@/lib/session'

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  /** The token is stored but `GET /me` failed for a reason other than a rejected token. */
  | { status: 'error'; user: null }
  | { status: 'authenticated'; user: Me }

interface AuthContextValue {
  status: AuthState['status']
  user: Me | null
  /** Marks the user as logged in right after login or register. */
  signIn: (user: Me) => void
  signOut: () => void
  /** Asks `GET /me` again after the `error` status. */
  retry: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ANONYMOUS: AuthState = { status: 'anonymous', user: null }
const LOADING: AuthState = { status: 'loading', user: null }

/** Largest delay `setTimeout` accepts; a longer one fires immediately. */
const MAX_TIMEOUT = 2 ** 31 - 1

/**
 * Holds who is using the app. Without a stored token the user is anonymous and
 * `GET /me` is not called; with one, `GET /me` decides. Only a rejected token
 * logs the user out: a network or server failure ends in `error`, keeping the token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => (getToken() ? LOADING : ANONYMOUS))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!getToken()) {
      setState(ANONYMOUS)
      return
    }
    let cancelled = false
    getMe()
      .then((user) => {
        if (!cancelled) setState({ status: 'authenticated', user })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const rejected = error instanceof ApiError && error.status === 401
        setState(rejected ? ANONYMOUS : { status: 'error', user: null })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => onSessionExpired(() => setState(ANONYMOUS)), [])

  // The token can run out while the app stays open without making a request.
  const authenticated = state.status === 'authenticated'
  useEffect(() => {
    if (!authenticated) return
    const expiry = getTokenExpiry()
    if (expiry === null) return
    const timer = setTimeout(expireSession, Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT))
    return () => clearTimeout(timer)
  }, [authenticated])

  const signIn = useCallback(
    (user: Me) => setState({ status: 'authenticated', user }),
    [],
  )
  const signOut = useCallback(() => {
    logout()
    setState(ANONYMOUS)
  }, [])
  const retry = useCallback(() => {
    setState(LOADING)
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo(
    () => ({ status: state.status, user: state.user, signIn, signOut, retry }),
    [state, signIn, signOut, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
