import { api } from '@/lib/api'
import type { ListingCard, PickupOption } from '@/lib/listings'

/** `IN_PROGRESS` is the "Agendados" tab, `COMPLETED` is "Completados" (PUR-1). */
export type PurchaseStatus = 'IN_PROGRESS' | 'COMPLETED'

/** Row of `GET /me/purchases` (API contract §6). */
export interface Purchase {
  id: string
  reservedAt: string
  sellerHandedOverAt: string | null
  /** Only the buyer's reception completes a purchase (PUR-2). */
  buyerReceivedAt: string | null
  listing: ListingCard
  pickupOption: PickupOption
}

export function getMyPurchases(status: PurchaseStatus): Promise<Purchase[]> {
  return api<Purchase[]>(`/me/purchases?status=${status}`)
}
