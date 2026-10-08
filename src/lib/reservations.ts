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
