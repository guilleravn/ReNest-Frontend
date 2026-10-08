import { api, ApiError } from '@/lib/api'
import { clearToken, getToken, setToken } from '@/lib/session'

export type City =
  | 'COCHABAMBA_BO'
  | 'AREQUIPA_PE'
  | 'SAN_SALVADOR_SV'
  | 'UTAH_US'

export interface Me {
  id: string
  email: string
  fullName: string
  phoneE164: string
  city: City
  avatarUrl: string | null
  isVerified: boolean
}

export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: Me
}

export interface RegisterInput {
  email: string
  password: string
  fullName: string
  phoneE164: string
  city: City
}

async function authenticate(
  path: string,
  body: unknown,
): Promise<AuthResponse> {
  const response = await api<AuthResponse>(path, { method: 'POST', body })
  setToken(response.accessToken)
  return response
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return authenticate('/auth/login', { email, password })
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return authenticate('/auth/register', input)
}

export function getMe(): Promise<Me> {
  return api<Me>('/me')
}

/**
 * The logged-in user on public pages, or null for visitors. A session the
 * API rejects is discarded instead of sending the visitor to login (GEN-5).
 */
export async function getSessionUser(): Promise<Me | null> {
  if (!getToken()) return null
  try {
    return await api<Me>('/me', { redirectOnUnauthorized: false })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken()
      return null
    }
    throw error
  }
}

/** There is no logout endpoint: the client just discards the token. */
export function logout(): void {
  clearToken()
}
