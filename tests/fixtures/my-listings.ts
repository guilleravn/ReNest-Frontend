// GET /me/listings?status=… payloads (API contract §5).
import { completedSale, pendingSale } from './reservations'

const card = pendingSale.listing

export const activeItem = {
  listing: {
    ...card,
    id: '0192d3a4-0000-7000-8000-0000000000a3',
    title: 'Lámpara de pie de latón',
    priceCents: 45000,
    condition: 'GENTLY_USED',
    category: { id: '0192d3a4-0000-7000-8000-0000000000c1', name: 'Muebles', slug: 'muebles' },
    status: 'ACTIVE',
  },
  reservation: null,
}

const saleReservation = (sale: typeof pendingSale) => ({
  id: sale.id,
  reservedAt: sale.reservedAt,
  sellerHandedOverAt: sale.sellerHandedOverAt,
  buyer: { id: sale.counterpart.id, fullName: sale.counterpart.fullName },
  pickupOption: sale.pickupOption,
})

export const pendingItem = {
  listing: pendingSale.listing,
  reservation: saleReservation(pendingSale),
}

export const completedItem = {
  listing: completedSale.listing,
  reservation: saleReservation(completedSale),
}
