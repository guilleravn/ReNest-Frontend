import type { ListingCondition, Weekday } from '@/lib/listings'

const wholePrice = new Intl.NumberFormat('es', { maximumFractionDigits: 0, useGrouping: 'always' })
const centsPrice = new Intl.NumberFormat('es', { minimumFractionDigits: 2, useGrouping: 'always' })

/** Cents → "$1.800", "$12,50". "$" is a generic sign for every city (GEN-2). */
export function formatPrice(cents: number): string {
  const format = cents % 100 === 0 ? wholePrice : centsPrice
  return `$${format.format(cents / 100)}`
}

const CONDITION_LABELS: Record<ListingCondition, string> = {
  LIKE_NEW: 'Como nuevo',
  GENTLY_USED: 'Poco uso',
  HEAVILY_USED: 'Muy usado',
}

export function conditionLabel(condition: ListingCondition): string {
  return CONDITION_LABELS[condition]
}

const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: 'lunes',
  TUESDAY: 'martes',
  WEDNESDAY: 'miércoles',
  THURSDAY: 'jueves',
  FRIDAY: 'viernes',
  SATURDAY: 'sábados',
  SUNDAY: 'domingos',
}

const listFormat = new Intl.ListFormat('es', { type: 'conjunction' })

/** "los lunes y miércoles · 18:30–20:00" */
export function formatPickupTime(weekdays: Weekday[], startTime: string, endTime: string): string {
  return `los ${listFormat.format(weekdays.map((day) => WEEKDAY_LABELS[day]))} · ${startTime}–${endTime}`
}

const ratingFormat = new Intl.NumberFormat('es', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 4.9 → "4,9" */
export function formatRating(average: number): string {
  return ratingFormat.format(average)
}

/** "1 reseña", "63 reseñas" */
export function formatReviewCount(count: number): string {
  return `${count} ${count === 1 ? 'reseña' : 'reseñas'}`
}

/** Seller card rating line: "4,9" + "63 reseñas", or "Sin calificaciones aún" (BRW-6). */
export function formatSellerRating({ average, count }: { average: number | null; count: number }): {
  rating: string
  reviews?: string
} {
  if (average === null) return { rating: 'Sin calificaciones aún' }
  return { rating: formatRating(average), reviews: formatReviewCount(count) }
}
