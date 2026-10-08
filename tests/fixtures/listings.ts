// GET /listings/:listingId payloads (API contract §4).

const LISTING_ID = '0192d3a4-0000-7000-8000-0000000000a1'

/** 1×1 PNG so the gallery has a real image to load. */
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export const listingDetail = {
  id: LISTING_ID,
  title: 'Aparador de teca mediados de siglo',
  description: 'Teca maciza, tres cajones y un mueble con puerta corrediza.',
  condition: 'GENTLY_USED',
  priceCents: 18500,
  status: 'ACTIVE',
  publishedAt: '2026-10-07T15:04:05.000Z',
  category: { id: '0192d3a4-0000-7000-8000-0000000000c1', name: 'Muebles', slug: 'muebles' },
  photos: [0, 1, 2].map((position) => ({
    id: `0192d3a4-0000-7000-8000-00000000010${position}`,
    url: PHOTO,
    position,
  })),
  pickupOptions: [
    {
      id: '0192d3a4-0000-7000-8000-0000000000b1',
      locationLabel: 'Café Toscano, Av. Álvaro Obregón',
      weekdays: ['SATURDAY'],
      startTime: '10:00',
      endTime: '13:00',
    },
    {
      id: '0192d3a4-0000-7000-8000-0000000000b2',
      locationLabel: 'Plaza Principal',
      weekdays: ['TUESDAY', 'THURSDAY'],
      startTime: '18:00',
      endTime: '20:00',
    },
  ],
  seller: {
    id: '0192d3a4-0000-7000-8000-0000000000e1',
    fullName: 'Priya Mehta',
    avatarUrl: null,
    city: 'COCHABAMBA_BO',
    isVerified: true,
    rating: { average: 4.9, count: 63 },
    phoneE164: null as string | null,
  },
  viewer: { isSeller: false, canReserve: false, canEdit: false },
}

export type ListingDetailFixture = typeof listingDetail

/** The same listing as a logged-in buyer sees it: phone filled, can reserve. */
export const listingDetailForBuyer: ListingDetailFixture = {
  ...listingDetail,
  seller: { ...listingDetail.seller, phoneE164: '+525512345678' },
  viewer: { isSeller: false, canReserve: true, canEdit: false },
}

export const listingNotFoundError = {
  statusCode: 404,
  code: 'LISTING_NOT_FOUND',
  message: 'Listing not found.',
  details: null,
}

export const internalError = {
  statusCode: 500,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
  details: null,
}

/** The same listing as its seller sees it (opened from My Listings). */
export const ownListingDetail: ListingDetailFixture = {
  ...listingDetail,
  seller: { ...listingDetail.seller, phoneE164: '+525512345678' },
  viewer: { isSeller: true, canReserve: false, canEdit: true },
}
