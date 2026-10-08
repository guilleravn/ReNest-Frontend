import { api } from '@/lib/api'
import type { City } from '@/lib/auth'

export type ListingCondition = 'LIKE_NEW' | 'GENTLY_USED' | 'HEAVILY_USED'
export type ListingStatus = 'ACTIVE' | 'PENDING' | 'COMPLETED'
export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Photo {
  id: string
  url: string
  position: number
}

export interface PickupOption {
  id: string
  locationLabel: string
  weekdays: Weekday[]
  startTime: string
  endTime: string
}

export interface SellerPublic {
  id: string
  fullName: string
  avatarUrl: string | null
  city: City
  isVerified: boolean
  rating: { average: number | null; count: number }
}

export interface ListingDetail {
  id: string
  title: string
  description: string
  condition: ListingCondition
  priceCents: number
  status: ListingStatus
  publishedAt: string
  category: Category
  photos: Photo[]
  /** Empty when the listing is not ACTIVE. */
  pickupOptions: PickupOption[]
  /** `phoneE164` is null without a valid session (GEN-7). */
  seller: SellerPublic & { phoneE164: string | null }
  viewer: { isSeller: boolean; canReserve: boolean; canEdit: boolean }
}

export function getListing(id: string): Promise<ListingDetail> {
  return api<ListingDetail>(`/listings/${encodeURIComponent(id)}`)
}
