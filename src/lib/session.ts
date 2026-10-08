const TOKEN_KEY = 'renest.accessToken'

type ExpiredListener = () => void

const expiredListeners = new Set<ExpiredListener>()

/** Subscribes to the session ending without the user asking for it. Returns the unsubscribe. */
export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener)
  return () => expiredListeners.delete(listener)
}

/** Discards the token and tells the subscribers the session is over. */
export function expireSession(): void {
  clearToken()
  expiredListeners.forEach((listener) => listener())
}

/** The stored token, or null when there is none or it has expired (then it is discarded). */
export function getToken(): string | null {
  let token: string | null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
  if (token && !isUnexpired(token)) {
    expireSession()
    return null
  }
  return token
}

/** When the stored token expires (ms since epoch), or null when there is none or it is unreadable. */
export function getTokenExpiry(): number | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? readExpiry(token) : null
  } catch {
    return null
  }
}

/** Reads the JWT `exp` claim without verifying it; the API still has the last word. */
function readExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function isUnexpired(token: string): boolean {
  const expiry = readExpiry(token)
  return expiry !== null && expiry > Date.now()
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage unavailable: the session just won't persist.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear.
  }
}
