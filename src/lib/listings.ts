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

/** The reservation behind a Pending or Completed listing. No buyer phone here. */
export interface SaleReservation {
  id: string
  reservedAt: string
  sellerHandedOverAt: string | null
  buyer: { id: string; fullName: string }
  pickupOption: PickupOption
}

export interface MyListing {
  listing: ListingCard
  /** Null on ACTIVE. */
  reservation: SaleReservation | null
}

/** Seller tabs, newest first (SAL-1). */
export function getMyListings(status: ListingStatus): Promise<MyListing[]> {
  return api<MyListing[]>(`/me/listings?status=${status}`)
}

export interface UploadedPhoto {
  /** Sent back in `photoKeys` when publishing. */
  storageKey: string
  url: string
}

/** One photo, uploaded as soon as it is picked (LST-2). Errors: 400 INVALID_FILE. */
export function uploadPhoto(file: File): Promise<UploadedPhoto> {
  const body = new FormData()
  body.append('file', file)
  return api<UploadedPhoto>('/uploads/photos', { method: 'POST', body })
}

/** POST /listings body (API contract §5). */
export interface NewListing {
  categoryId: string
  title: string
  description: string
  condition: ListingCondition
  priceCents: number
  /** In order; the first is the cover. */
  photoKeys: string[]
  pickupOptions: Omit<PickupOption, 'id'>[]
}

/**
 * Publishes the listing, its photos and its pickup pairs in one transaction
 * (LST-10). Errors: 400 VALIDATION_ERROR, 422 CATEGORY_NOT_FOUND, 422 INVALID_PHOTO_KEY.
 */
export function createListing(listing: NewListing): Promise<ListingDetail> {
  return api<ListingDetail>('/listings', { method: 'POST', body: listing })
}

/** One photo of the new set: one the listing has, or a new upload. */
export type PhotoInput = { photoId: string } | { storageKey: string }

/** PATCH /listings/:listingId body: any subset of the details (API contract §5). */
export interface ListingUpdate {
  categoryId?: string
  title?: string
  description?: string
  condition?: ListingCondition
  priceCents?: number
  /** Replaces the whole set, in order; the first is the cover (LST-12). */
  photos?: PhotoInput[]
}

/**
 * Edits an Active listing; its publish date doesn't change (LST-13). Errors:
 * 400 VALIDATION_ERROR, 403 NOT_LISTING_OWNER, 404 LISTING_NOT_FOUND,
 * 409 LISTING_NOT_EDITABLE, 422 CATEGORY_NOT_FOUND, 422 INVALID_PHOTO_KEY.
 */
export function updateListing(id: string, update: ListingUpdate): Promise<ListingDetail> {
  return api<ListingDetail>(`/listings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: update,
  })
}
