import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { TextLink } from '@/components/ui/text-link'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { safeNext, withNext } from '@/lib/redirect'
import { login } from '@/lib/auth'

// Login never says which field was wrong: input the API rejects (e.g. a
// password over 72 characters) gets the same message as wrong credentials.
const CREDENTIALS_ERRORS = new Set<ErrorCode>([
  ErrorCode.INVALID_CREDENTIALS,
  ErrorCode.VALIDATION_ERROR,
])

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && CREDENTIALS_ERRORS.has(error.code)) {
    return 'Correo o contraseña incorrectos'
  }
  return 'No pudimos iniciar sesión. Inténtalo de nuevo.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(safeNext(next), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <>
      <AuthLayout
        footer={
          <>
            ¿No tienes cuenta? <TextLink to={withNext('/register', next)}>Regístrate</TextLink>
          </>
        }
      >
        <PageHeader title="Inicia sesión" description="Bienvenido de vuelta a ReNest." />

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <FormField label="Correo" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>

          <Button type="submit" fullWidth className="mt-1" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </AuthLayout>

      {error && (
        <ToastViewport>
          <Toast tone="error" onDismiss={() => setError(null)}>
            {error}
          </Toast>
        </ToastViewport>
      )}
    </>
  )
}
