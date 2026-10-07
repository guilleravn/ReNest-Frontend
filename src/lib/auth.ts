import { api } from '@/lib/api'
import { setToken } from '@/lib/session'

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
