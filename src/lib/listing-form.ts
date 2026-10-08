import type { ListingCondition, UploadedPhoto } from '@/lib/listings'

// UX mirror of the publish rules (LST-1..5, GEN-2). The API enforces them.
export const MAX_PHOTOS = 3
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const TITLE_MIN = 3
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 2000
/** Whole dollars: $1 to $20.000.000 (100 to 2.000.000.000 cents). */
export const PRICE_MIN = 1
export const PRICE_MAX = 20_000_000

/** Step 1 of a new listing; also the shape an edit form starts from. */
export interface ListingDetailsValues {
  /** In order; the first is the cover. */
  photos: UploadedPhoto[]
  title: string
  categoryId: string
  condition: ListingCondition | ''
  /** Whole dollars as typed. */
  price: string
  description: string
}

export type ListingDetailsField = keyof ListingDetailsValues
export type ListingDetailsErrors = Partial<Record<ListingDetailsField, string>>

export const emptyListingDetails: ListingDetailsValues = {
  photos: [],
  title: '',
  categoryId: '',
  condition: '',
  price: '',
  description: '',
}

/** Field errors in Spanish; empty when the step can continue. */
export function validateListingDetails(values: ListingDetailsValues): ListingDetailsErrors {
  const errors: ListingDetailsErrors = {}
  const title = values.title.trim()
  const description = values.description.trim()

  if (values.photos.length === 0) errors.photos = 'Agrega al menos una foto'
  if (title.length < TITLE_MIN) errors.title = `Escribe al menos ${TITLE_MIN} caracteres`
  else if (title.length > TITLE_MAX) errors.title = `Usa como máximo ${TITLE_MAX} caracteres`
  if (!values.categoryId) errors.categoryId = 'Elige una categoría'
  if (!values.condition) errors.condition = 'Elige una condición'

  const price = priceToCents(values.price)
  if (price === null) errors.price = `Ingresa un precio entero de al menos $${PRICE_MIN}`
  else if (price > PRICE_MAX * 100) errors.price = 'Ingresa un precio de hasta $20.000.000'

  if (!description) errors.description = 'Agrega una descripción'
  else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Usa como máximo ${DESCRIPTION_MAX} caracteres`
  }
  return errors
}

/** "1800" → 180000. Null when it isn't a whole number of at least $1. */
export function priceToCents(price: string): number | null {
  const trimmed = price.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const dollars = Number(trimmed)
  return dollars >= PRICE_MIN ? dollars * 100 : null
}

/** Why a picked file can't be uploaded, or null when it can (LST-2). */
export function photoFileError(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Usa fotos JPG, PNG o WebP'
  if (file.size > MAX_PHOTO_BYTES) return 'Cada foto puede pesar hasta 5 MB'
  return null
}
