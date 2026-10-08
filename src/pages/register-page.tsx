import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input, Select } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { PageHeader } from '@/components/ui/page-header'
import { TextLink } from '@/components/ui/text-link'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { TrustNote } from '@/components/ui/trust-note'
import { ApiError } from '@/lib/api'
import { register, type City, type RegisterInput } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { CITY_OPTIONS } from '@/lib/cities'
import {
  PHONE_COUNTRIES,
  formatNational,
  sanitizeNationalDigits,
  toE164,
  validateNationalPhone,
} from '@/lib/phone-countries'

type Field = keyof RegisterInput
type FieldErrors = Partial<Record<Field, string>>

const FIELD_MESSAGES: Record<Field, string> = {
  fullName: 'El nombre debe tener entre 2 y 120 caracteres',
  email: 'Ingresa un correo válido',
  city: 'Elige tu zona de la lista',
  phoneE164: 'El teléfono no es válido para el país elegido',
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
    if (error.code === 'RATE_LIMITED') {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    }
    if (error.code === 'VALIDATION_ERROR') return 'Revisa los datos marcados.'
  }
  return 'No pudimos crear tu cuenta. Inténtalo de nuevo.'
}

export function RegisterPage() {
  const location = useLocation()
  const { signIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<City | ''>('')
  const [phoneDigits, setPhoneDigits] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<FieldErrors>({})

  const phoneRuleError = city ? validateNationalPhone(phoneDigits, city) : null
  const phoneError =
    (phoneTouched ? phoneRuleError : null) ?? invalid.phoneE164 ?? null

  function handleCityChange(next: City) {
    setCity(next)
    setPhoneDigits((digits) => sanitizeNationalDigits(digits, next))
    setInvalid(({ city: _city, phoneE164: _phone, ...rest }) => rest)
  }

  function edit(field: Field, setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setInvalid(({ [field]: _edited, ...rest }) => rest)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!city) return
    setPhoneTouched(true)
    if (validateNationalPhone(phoneDigits, city)) return
    setSubmitting(true)
    setError(null)
    setInvalid({})
    try {
      const { user } = await register({ fullName: name, email, phoneE164: toE164(phoneDigits, city), password, city })
      signIn(user)
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
            ¿Ya tienes cuenta? <TextLink to="/login" state={location.state}>Inicia sesión</TextLink>
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
              onChange={(event) => edit('city', (value) => handleCityChange(value as City))(event.target.value)}
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
            hint={
              city
                ? `Se usa para coordinar por WhatsApp. ${PHONE_COUNTRIES[city].hint}`
                : 'Elige tu zona para ingresar tu teléfono.'
            }
            error={phoneError}
          >
            <PhoneInput
              id="phone"
              name="phone"
              autoComplete="tel-national"
              prefix={city ? `+${PHONE_COUNTRIES[city].callingCode}` : '+'}
              placeholder={city ? PHONE_COUNTRIES[city].placeholder : ''}
              disabled={!city}
              invalid={phoneError !== null}
              value={city ? formatNational(phoneDigits, city) : ''}
              onChange={(event) => {
                if (!city) return
                edit('phoneE164', (value) => setPhoneDigits(sanitizeNationalDigits(value, city)))(
                  event.target.value,
                )
              }}
              onBlur={() => setPhoneTouched(true)}
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
