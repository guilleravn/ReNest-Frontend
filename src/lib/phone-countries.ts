import type { City } from '@/lib/auth'

/**
 * Phone rules per supported country (AUTH-4). Mirrors the backend table in
 * `ReNest-Backend/src/auth/phone-countries.ts`; the backend is the authority.
 */
export interface PhoneCountry {
  callingCode: string
  /** Digits after the calling code. */
  length: number
  /** Matches the national digits. */
  pattern: RegExp
  /** Digit group sizes used by the mask, e.g. [4, 4] → "7123 4567". */
  groups: number[]
  placeholder: string
  /** Spanish hint shown under the field. */
  hint: string
}

export const PHONE_COUNTRIES: Record<City, PhoneCountry> = {
  COCHABAMBA_BO: {
    callingCode: '591',
    length: 8,
    pattern: /^[67]\d{7}$/,
    groups: [4, 4],
    placeholder: '7123 4567',
    hint: '8 dígitos, empieza con 6 o 7.',
  },
  AREQUIPA_PE: {
    callingCode: '51',
    length: 9,
    pattern: /^9\d{8}$/,
    groups: [3, 3, 3],
    placeholder: '912 345 678',
    hint: '9 dígitos, empieza con 9.',
  },
  SAN_SALVADOR_SV: {
    callingCode: '503',
    length: 8,
    pattern: /^[67]\d{7}$/,
    groups: [4, 4],
    placeholder: '7123 4567',
    hint: '8 dígitos, empieza con 6 o 7.',
  },
  UTAH_US: {
    callingCode: '1',
    length: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    groups: [3, 3, 4],
    placeholder: '385 234 5678',
    hint: '10 dígitos, sin el 1 inicial.',
  },
}

/** Keeps only digits, capped to the country's length. */
export function sanitizeNationalDigits(raw: string, city: City): string {
  return raw.replace(/\D/g, '').slice(0, PHONE_COUNTRIES[city].length)
}

/** Applies the display mask to national digits. */
export function formatNational(digits: string, city: City): string {
  const parts: string[] = []
  let start = 0
  for (const size of PHONE_COUNTRIES[city].groups) {
    if (start >= digits.length) break
    parts.push(digits.slice(start, start + size))
    start += size
  }
  return parts.join(' ')
}

/** Spanish error message, or `null` when the number is valid. */
export function validateNationalPhone(
  digits: string,
  city: City,
): string | null {
  const { length, pattern } = PHONE_COUNTRIES[city]
  if (digits.length === 0) return 'Ingresa tu teléfono'
  if (digits.length < length) {
    return `El teléfono debe tener ${length} dígitos`
  }
  if (!pattern.test(digits)) return 'Ingresa un número de celular válido'
  return null
}

/** Value sent to the API: "+" + calling code + national digits. */
export function toE164(digits: string, city: City): string {
  return `+${PHONE_COUNTRIES[city].callingCode}${digits}`
}
