import { ErrorCode } from '@/lib/error-codes'
import { loginPath } from '@/lib/redirect'
import { clearToken, getToken } from '@/lib/session'

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? '/api/v1'

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details: FieldError[] | null

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details: FieldError[] | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** false: a 401 throws an ApiError instead of logging out and going to login. */
  redirectOnUnauthorized?: boolean
}

export async function api<T>(
  path: string,
  { method = 'GET', body, redirectOnUnauthorized = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload: unknown = await response.json().catch(() => null)

  // A 401 outside /auth means the session is gone or expired: log
  // out and send to login, coming back here afterwards. Login's own 401 is
  // a wrong password and is handled by the page.
  if (response.status === 401 && redirectOnUnauthorized && !path.startsWith('/auth/')) {
    clearToken()
    window.location.assign(loginPath(window.location.pathname + window.location.search))
    return new Promise<never>(() => {})
  }

  if (!response.ok) {
    const error = (payload ?? {}) as Partial<{
      code: ErrorCode
      message: string
      details: FieldError[] | null
    }>
    throw new ApiError(
      response.status,
      error.code ?? ErrorCode.INTERNAL_ERROR,
      error.message ?? response.statusText,
      error.details ?? null,
    )
  }

  return payload as T
}
