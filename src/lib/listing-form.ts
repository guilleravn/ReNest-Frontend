import type { ListingCondition, NewListing, UploadedPhoto, Weekday } from '@/lib/listings'

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

// UX mirror of the pickup pair rules (LST-6, LST-7). The API enforces them.
export const MAX_PICKUP_OPTIONS = 3
export const LOCATION_MIN = 3
export const LOCATION_MAX = 120
export const WEEKDAYS: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

/** One pickup pair before publishing; times are "HH:mm". */
export interface PickupOptionDraft {
  locationLabel: string
  weekdays: Weekday[]
  startTime: string
  endTime: string
}

export type PickupOptionErrors = Partial<Record<keyof PickupOptionDraft, string>>

export const emptyPickupOption: PickupOptionDraft = {
  locationLabel: '',
  weekdays: [],
  startTime: '',
  endTime: '',
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** Field errors in Spanish; empty when the pair can be added. */
export function validatePickupOption(draft: PickupOptionDraft): PickupOptionErrors {
  const errors: PickupOptionErrors = {}
  const place = draft.locationLabel.trim()
  if (place.length < LOCATION_MIN) errors.locationLabel = `Escribe al menos ${LOCATION_MIN} caracteres`
  else if (place.length > LOCATION_MAX) errors.locationLabel = `Usa como máximo ${LOCATION_MAX} caracteres`
  if (draft.weekdays.length === 0) errors.weekdays = 'Elige al menos un día'
  if (!HHMM.test(draft.startTime)) errors.startTime = 'Elige la hora de inicio'
  if (!HHMM.test(draft.endTime)) errors.endTime = 'Elige la hora de fin'
  else if (HHMM.test(draft.startTime) && draft.endTime <= draft.startTime) {
    errors.endTime = 'Debe ser después de la hora de inicio'
  }
  return errors
}

/** Trimmed, with the days in calendar order. */
export function normalizePickupOption(draft: PickupOptionDraft): PickupOptionDraft {
  return {
    ...draft,
    locationLabel: draft.locationLabel.trim(),
    weekdays: WEEKDAYS.filter((day) => draft.weekdays.includes(day)),
  }
}

/** The POST /listings body; call it once both steps are valid. */
export function toNewListing(
  details: ListingDetailsValues,
  pickupOptions: PickupOptionDraft[],
): NewListing {
  return {
    categoryId: details.categoryId,
    title: details.title.trim(),
    description: details.description.trim(),
    condition: details.condition as ListingCondition,
    priceCents: priceToCents(details.price) ?? 0,
    photoKeys: details.photos.map((photo) => photo.storageKey),
    pickupOptions,
  }
}

const API_DETAILS_FIELDS: Record<string, ListingDetailsField> = {
  categoryId: 'categoryId',
  title: 'title',
  description: 'description',
  condition: 'condition',
  priceCents: 'price',
  photoKeys: 'photos',
}

/** The step 1 field an API `details[].field` points to ("photoKeys[1]" → photos), if any. */
export function detailsFieldOf(apiField: string): ListingDetailsField | null {
  return API_DETAILS_FIELDS[apiField.split(/[.[]/)[0]] ?? null
}
