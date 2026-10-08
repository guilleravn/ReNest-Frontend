import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { TextLink } from '@/components/ui/text-link'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { TrustNote } from '@/components/ui/trust-note'
import { ApiError } from '@/lib/api'
import { safeNext, withNext } from '@/lib/redirect'
import { register, type City, type RegisterInput } from '@/lib/auth'
import { CITY_OPTIONS } from '@/lib/cities'

type Field = keyof RegisterInput
type FieldErrors = Partial<Record<Field, string>>

// Same E.164 rule as the API, as an HTML pattern attribute.
const PHONE_PATTERN = String.raw`\+[1-9]\d{7,14}`

const FIELD_MESSAGES: Record<Field, string> = {
  fullName: 'El nombre debe tener entre 2 y 120 caracteres',
  email: 'Ingresa un correo válido',
  city: 'Elige tu zona de la lista',
  phoneE164: 'Usa el formato internacional, por ejemplo +59171234567',
  password: 'La contraseña debe tener entre 8 y 72 caracteres',
}

function fieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {}
  const errors: FieldErrors = {}
  for (const { field } of error.details ?? []) {
    if (field in FIELD_MESSAGES) errors[field as Field] = FIELD_MESSAGES[field as Field]
  }
  return errors
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'EMAIL_TAKEN') return 'El correo ya está en uso'
    if (error.code === 'VALIDATION_ERROR') return 'Revisa los datos marcados.'
  }
  return 'No pudimos crear tu cuenta. Inténtalo de nuevo.'
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<City | ''>('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<FieldErrors>({})

  function edit(field: Field, setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setInvalid(({ [field]: _edited, ...rest }) => rest)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!city) return
    setSubmitting(true)
    setError(null)
    setInvalid({})
    try {
      await register({ fullName: name, email, phoneE164: phone, password, city })
      navigate(safeNext(next), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setInvalid(fieldErrors(err))
      setSubmitting(false)
    }
  }

  return (
    <>
      <AuthLayout
        footer={
          <>
            ¿Ya tienes cuenta? <TextLink to={withNext('/login', next)}>Inicia sesión</TextLink>
          </>
        }
      >
        <PageHeader
          title="Crea tu cuenta"
          description="Compra y vende artículos de segunda mano en tu ciudad."
        />

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nombre" htmlFor="name" error={invalid.fullName}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Tu nombre"
              required
              minLength={2}
              maxLength={120}
              invalid={!!invalid.fullName}
              value={name}
              onChange={(event) => edit('fullName', setName)(event.target.value)}
            />
          </FormField>

          <FormField label="Correo" htmlFor="email" error={invalid.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              maxLength={255}
              invalid={!!invalid.email}
              value={email}
              onChange={(event) => edit('email', setEmail)(event.target.value)}
            />
          </FormField>

          <FormField
            label="Tu zona"
            htmlFor="zone"
            hint="Para mostrarte artículos cerca y coordinar recogidas."
            error={invalid.city}
          >
            <Select
              id="zone"
              name="zone"
              placeholder="Elige tu zona"
              required
              invalid={!!invalid.city}
              value={city}
              onChange={(event) => edit('city', (value) => setCity(value as City))(event.target.value)}
            >
              {CITY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Teléfono"
            htmlFor="phone"
            hint="Con código de país, por ejemplo +59171234567. Se usa para coordinar la entrega por WhatsApp."
            error={invalid.phoneE164}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+525512345678"
              required
              pattern={PHONE_PATTERN}
              title={FIELD_MESSAGES.phoneE164}
              invalid={!!invalid.phoneE164}
              value={phone}
              onChange={(event) => edit('phoneE164', setPhone)(event.target.value)}
            />
          </FormField>

          <FormField
            label="Contraseña"
            htmlFor="password"
            hint="Entre 8 y 72 caracteres."
            error={invalid.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
              maxLength={72}
              invalid={!!invalid.password}
              value={password}
              onChange={(event) => edit('password', setPassword)(event.target.value)}
            />
          </FormField>

          <Button type="submit" fullWidth className="mt-1" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <TrustNote className="mt-4">
          Coordinas la entrega directamente con el vendedor por WhatsApp.
        </TrustNote>
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
