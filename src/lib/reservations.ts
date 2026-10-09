import { api } from '@/lib/api'
import type { ListingCard, PickupOption } from '@/lib/listings'

export interface ReservationDetail {
  id: string
  viewerRole: 'BUYER' | 'SELLER'
  reservedAt: string
  sellerHandedOverAt: string | null
  buyerReceivedAt: string | null
  listing: ListingCard
  pickupOption: PickupOption
  /** The seller for the buyer, the buyer for the seller. */
  counterpart: {
    id: string
    fullName: string
    avatarUrl: string | null
    phoneE164: string
    isVerified: boolean
  }
  receptionChecklist: {
    matchesListing: boolean
    worksNoUndisclosedDamage: boolean
    allPartsIncluded: boolean
    issueReport: string | null
    createdAt: string
  } | null
  rating: { stars: number; createdAt: string } | null
  /** Computed by the API; the UI never re-implements the rules. */
  actions: {
    canConfirmHandover: boolean
    canConfirmReception: boolean
    canRate: boolean
  }
}

/** Buyer and seller only; anyone else gets 404 RESERVATION_NOT_FOUND. */
export function getReservation(id: string): Promise<ReservationDetail> {
  return api<ReservationDetail>(`/reservations/${encodeURIComponent(id)}`)
}

/**
 * Reserves the listing and fixes the pickup pair in one step (RES-3).
 * Rejections: 409 LISTING_NOT_AVAILABLE, 422 INVALID_PICKUP_OPTION,
 * 403 CANNOT_RESERVE_OWN_LISTING, 404 LISTING_NOT_FOUND.
 */
export function createReservation(listingId: string, pickupOptionId: string): Promise<ReservationDetail> {
  return api<ReservationDetail>('/reservations', {
    method: 'POST',
    body: { listingId, pickupOptionId },
  })
}

/**
 * Seller only. Moves the listing to Completed; the buyer's purchase doesn't
 * change. A second confirmation gets 409 HANDOVER_ALREADY_CONFIRMED.
 */
export function confirmHandover(id: string): Promise<ReservationDetail> {
  return api<ReservationDetail>(`/reservations/${encodeURIComponent(id)}/handover`, {
    method: 'POST',
  })
}

/** The buyer's answers to the reception checklist (PUR-5). */
export interface ReceptionAnswers {
  matchesListing: boolean
  worksNoUndisclosedDamage: boolean
  allPartsIncluded: boolean
  issueReport: string | null
}

/**
 * Buyer only, once (PUR-7). Works before or after the seller's handover
 * (PUR-4). A second confirmation gets 409 RECEPTION_ALREADY_CONFIRMED.
 */
export function confirmReception(id: string, answers: ReceptionAnswers): Promise<ReservationDetail> {
  return api<ReservationDetail>(`/reservations/${encodeURIComponent(id)}/reception`, {
    method: 'POST',
    // The button is disabled until "Tengo el artículo conmigo ahora" is checked.
    body: { ...answers, hasItemNow: true },
  })
}

/**
 * Buyer only, once, after reception (PUR-8). Rejections:
 * 409 ALREADY_RATED, 409 RECEPTION_NOT_CONFIRMED.
 */
export function rateSeller(id: string, stars: number): Promise<{ stars: number; createdAt: string }> {
  return api<{ stars: number; createdAt: string }>(`/reservations/${encodeURIComponent(id)}/rating`, {
    method: 'POST',
    body: { stars },
  })
}
