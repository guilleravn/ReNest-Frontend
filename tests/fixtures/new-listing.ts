// POST /uploads/photos and POST /listings payloads (API contract §5).

const SELLER_ID = '0190a1b2-0000-7000-8000-000000000001'

/** 1×1 PNG so the previews have a real image to load. */
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** The `n`-th upload's response; keys follow `uploads/<userId>/<uuid>.<ext>`. */
export function uploadedPhoto(n: number) {
  return {
    storageKey: `uploads/${SELLER_ID}/0192d3a4-0000-7000-8000-00000000f00${n}.png`,
    url: PHOTO,
  }
}

/** A file to hand to the picker. */
export function photoFile(name = 'silla.png', mimeType = 'image/png') {
  return { name, mimeType, buffer: Buffer.from('fake image bytes') }
}

export const invalidFileError = {
  statusCode: 400,
  code: 'INVALID_FILE',
  message: 'The photo must be a JPEG, PNG or WebP image.',
  details: null,
}

export const NEW_LISTING_ID = '0192d3a4-0000-7000-8000-0000000000a9'

/** What POST /listings answers for the listing the spec fills in. */
export const publishedListing = {
  id: NEW_LISTING_ID,
  title: 'Silla de comedor en roble',
  description: 'Roble macizo, sin rayones.',
  condition: 'GENTLY_USED',
  priceCents: 18000,
  status: 'ACTIVE',
  publishedAt: '2026-10-08T15:04:05.000Z',
  category: { id: '0192d3a4-0000-7000-8000-0000000000c1', name: 'Muebles', slug: 'muebles' },
  photos: [0, 1].map((position) => ({
    id: `0192d3a4-0000-7000-8000-00000000020${position}`,
    url: PHOTO,
    position,
  })),
  pickupOptions: [
    {
      id: '0192d3a4-0000-7000-8000-0000000000b9',
      locationLabel: 'Plaza Principal',
      weekdays: ['MONDAY', 'WEDNESDAY'],
      startTime: '18:30',
      endTime: '20:00',
    },
  ],
  seller: {
    id: SELLER_ID,
    fullName: 'Laura Gómez',
    avatarUrl: null,
    city: 'COCHABAMBA_BO',
    isVerified: false,
    rating: { average: null, count: 0 },
    phoneE164: '+525512345678',
  },
  viewer: { isSeller: true, canReserve: false, canEdit: true },
}

/** The same listing as a My Listings row (Activos). */
export const publishedItem = {
  listing: {
    id: NEW_LISTING_ID,
    title: publishedListing.title,
    priceCents: publishedListing.priceCents,
    condition: publishedListing.condition,
    category: publishedListing.category,
    status: 'ACTIVE',
    coverPhotoUrl: PHOTO,
    city: 'COCHABAMBA_BO',
    sellerIsVerified: false,
    publishedAt: publishedListing.publishedAt,
  },
  reservation: null,
}

export const categoryNotFoundError = {
  statusCode: 422,
  code: 'CATEGORY_NOT_FOUND',
  message: 'Category not found.',
  details: null,
}

export const invalidPhotoKeyError = {
  statusCode: 422,
  code: 'INVALID_PHOTO_KEY',
  message: 'Every photo must be one of your uploads.',
  details: null,
}

export const titleValidationError = {
  statusCode: 400,
  code: 'VALIDATION_ERROR',
  message: 'Validation failed.',
  details: [{ field: 'title', message: 'title must be shorter than or equal to 120 characters' }],
}

export const listingNotFoundError = {
  statusCode: 404,
  code: 'LISTING_NOT_FOUND',
  message: 'Listing not found.',
  details: null,
}

export const unauthorizedError = {
  statusCode: 401,
  code: 'UNAUTHORIZED',
  message: 'Invalid or expired token',
  details: null,
}
