const TOKEN_KEY = 'renest.accessToken'

/** The stored token, or null when there is none or it has expired (then it is discarded). */
export function getToken(): string | null {
  let token: string | null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
  if (token && !isUnexpired(token)) {
    clearToken()
    return null
  }
  return token
}

/** Reads the JWT `exp` claim without verifying it; the API still has the last word. */
function isUnexpired(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown }
    return typeof exp === 'number' && exp * 1000 > Date.now()
  } catch {
    return false
  }
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
