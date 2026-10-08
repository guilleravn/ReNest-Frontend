// GET /me/purchases and GET /reservations/:id payloads (API contract §2, §6).

/** 1×1 PNG so the cards have a real image to load. */
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export const RESERVATION_ID = '0192d3a4-0000-7000-8000-0000000000f1'

const listing = {
  id: '0192d3a4-0000-7000-8000-0000000000a1',
  title: 'Aparador de teca mediados de siglo',
  priceCents: 18500,
  condition: 'GENTLY_USED',
  category: { id: '0192d3a4-0000-7000-8000-0000000000c1', name: 'Muebles', slug: 'muebles' },
  status: 'PENDING',
  coverPhotoUrl: PHOTO,
  city: 'COCHABAMBA_BO',
  sellerIsVerified: true,
  publishedAt: '2026-10-07T15:04:05.000Z',
}

const pickupOption = {
  id: '0192d3a4-0000-7000-8000-0000000000b1',
  locationLabel: 'Café Toscano, Av. Álvaro Obregón',
  weekdays: ['SATURDAY'],
  startTime: '10:00',
  endTime: '13:00',
}

export const purchaseInProgress = {
  id: RESERVATION_ID,
  reservedAt: '2026-10-08T12:00:00.000Z',
  sellerHandedOverAt: null as string | null,
  buyerReceivedAt: null as string | null,
  listing,
  pickupOption,
}

export const purchaseCompleted = {
  id: '0192d3a4-0000-7000-8000-0000000000f2',
  reservedAt: '2026-10-01T12:00:00.000Z',
  sellerHandedOverAt: '2026-10-03T12:00:00.000Z',
  buyerReceivedAt: '2026-10-03T12:05:00.000Z',
  listing: {
    ...listing,
    id: '0192d3a4-0000-7000-8000-0000000000a2',
    title: 'Sillón de cuero',
    status: 'COMPLETED',
  },
  pickupOption: { ...pickupOption, id: '0192d3a4-0000-7000-8000-0000000000b2' },
}

export const reservationDetail = {
  ...purchaseInProgress,
  viewerRole: 'BUYER' as 'BUYER' | 'SELLER',
  counterpart: {
    id: '0192d3a4-0000-7000-8000-0000000000e1',
    fullName: 'Priya Mehta',
    avatarUrl: null,
    phoneE164: '+525512345678',
    isVerified: true,
  },
  receptionChecklist: null as object | null,
  rating: null as object | null,
  actions: { canConfirmHandover: false, canConfirmReception: true, canRate: false },
}

/** `receptionChecklist` once reception is confirmed (contract §2). */
export const receptionChecklist = {
  matchesListing: true,
  worksNoUndisclosedDamage: true,
  allPartsIncluded: true,
  issueReport: null,
  createdAt: '2026-10-09T12:00:00.000Z',
}

export type ReservationDetailFixture = typeof reservationDetail

export const reservationNotFoundError = {
  statusCode: 404,
  code: 'RESERVATION_NOT_FOUND',
  message: 'Reservation not found.',
  details: null,
}

export const receptionAlreadyConfirmedError = {
  statusCode: 409,
  code: 'RECEPTION_ALREADY_CONFIRMED',
  message: 'The reception was already confirmed.',
  details: null,
}

export const alreadyRatedError = {
  statusCode: 409,
  code: 'ALREADY_RATED',
  message: 'The seller was already rated for this purchase.',
  details: null,
}
