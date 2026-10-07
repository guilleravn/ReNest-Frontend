import { ErrorCode } from '@/lib/error-codes'
import { getToken } from '@/lib/session'

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

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
}

export async function api<T>(
  path: string,
  { method = 'GET', body }: RequestOptions = {},
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
