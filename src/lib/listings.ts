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

/** Feed card (API contract §2). `city` is the seller's city. */
export interface ListingCard {
  id: string
  title: string
  priceCents: number
  condition: ListingCondition
  category: Category
  status: ListingStatus
  coverPhotoUrl: string
  city: City
  sellerIsVerified: boolean
  publishedAt: string
}

export interface FeedPage {
  data: ListingCard[]
  /** null on the last page. */
  nextCursor: string | null
}

export interface FeedQuery {
  /** 2–60 characters; omit to list everything (BRW-2). */
  q?: string
  /** Category slug. */
  category?: string
  cursor?: string
}

/** Active listings, newest first, 20 per page (BRW-1, BRW-10). */
export function getFeed({ q, category, cursor }: FeedQuery = {}): Promise<FeedPage> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (cursor) params.set('cursor', cursor)
  const query = params.toString()
  return api<FeedPage>(`/listings${query ? `?${query}` : ''}`)
}

/** Sorted by name (BRW-3). */
export function getCategories(): Promise<Category[]> {
  return api<Category[]>('/categories')
}
