const HOME = '/feed'

/** Login URL that brings the user back to `path` afterwards. */
export function loginPath(path: string): string {
  return withNext('/login', path)
}

/** `path` carrying the pending return address, if any (login ↔ register links). */
export function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path
}

/** Where to go after login or sign up. Only paths inside the app are allowed. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return HOME
  }
  return next
}
