// GET /reservations/:reservationId and POST /reservations payloads (API contract §2, ReservationDetail).
import { listingDetailForBuyer } from './listings'

const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** A listing of the logged-in seller, reserved by Andrés, as the seller sees it. */
export const pendingSale = {
  id: '0192d3a4-0000-7000-8000-0000000000f1',
  viewerRole: 'SELLER',
  // Midday UTC, so the date is the same in every LatAm timezone.
  reservedAt: '2026-10-01T15:00:00.000Z',
  sellerHandedOverAt: null as string | null,
  buyerReceivedAt: null,
  listing: {
    id: '0192d3a4-0000-7000-8000-0000000000a2',
    title: 'Bicicleta urbana rodado 28',
    priceCents: 250000,
    condition: 'LIKE_NEW',
    category: { id: '0192d3a4-0000-7000-8000-0000000000c2', name: 'Deportes', slug: 'deportes' },
    status: 'PENDING',
    coverPhotoUrl: PHOTO,
    city: 'COCHABAMBA_BO',
    sellerIsVerified: false,
    publishedAt: '2026-09-28T15:00:00.000Z',
  },
  pickupOption: {
    id: '0192d3a4-0000-7000-8000-0000000000b3',
    locationLabel: 'Café Toscano, Av. Álvaro Obregón',
    weekdays: ['SATURDAY'],
    startTime: '10:00',
    endTime: '13:00',
  },
  counterpart: {
    id: '0192d3a4-0000-7000-8000-0000000000e2',
    fullName: 'Andrés Pérez',
    avatarUrl: null,
    phoneE164: '+51987654321',
    isVerified: false,
  },
  receptionChecklist: null,
  rating: null,
  actions: { canConfirmHandover: true, canConfirmReception: false, canRate: false },
}

export type SaleFixture = typeof pendingSale

export const completedSale: SaleFixture = {
  ...pendingSale,
  sellerHandedOverAt: '2026-10-03T15:00:00.000Z',
  listing: { ...pendingSale.listing, status: 'COMPLETED' },
  actions: { canConfirmHandover: false, canConfirmReception: false, canRate: false },
}

export const reservationNotFoundError = {
  statusCode: 404,
  code: 'RESERVATION_NOT_FOUND',
  message: 'Reservation not found.',
  details: null,
}

const [, plaza] = listingDetailForBuyer.pickupOptions

/** The buyer's new reservation of `listingDetailForBuyer` at "Plaza Principal" (POST /reservations). */
export const reservationDetail = {
  id: '0192d3a4-0000-7000-8000-0000000000f2',
  viewerRole: 'BUYER',
  reservedAt: '2026-10-08T15:04:05.000Z',
  sellerHandedOverAt: null,
  buyerReceivedAt: null,
  listing: {
    id: listingDetailForBuyer.id,
    title: listingDetailForBuyer.title,
    priceCents: listingDetailForBuyer.priceCents,
    condition: listingDetailForBuyer.condition,
    category: listingDetailForBuyer.category,
    status: 'PENDING',
    coverPhotoUrl: listingDetailForBuyer.photos[0].url,
    city: listingDetailForBuyer.seller.city,
    sellerIsVerified: true,
    publishedAt: listingDetailForBuyer.publishedAt,
  },
  pickupOption: plaza,
  counterpart: {
    id: listingDetailForBuyer.seller.id,
    fullName: 'Priya Mehta',
    avatarUrl: null,
    phoneE164: '+525512345678',
    isVerified: true,
  },
  receptionChecklist: null,
  rating: null,
  actions: { canConfirmHandover: false, canConfirmReception: true, canRate: false },
}
