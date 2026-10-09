// POST and DELETE /listings/:listingId/pickup-options payloads (API contract §5).

import { ownListingDetail, type ListingDetailFixture } from './listings'

const [cafe, plaza] = ownListingDetail.pickupOptions

/** The pair "Parque Central" the seller adds (POST answer). */
export const addedPickupOption = {
  id: '0192d3a4-0000-7000-8000-0000000000b3',
  locationLabel: 'Parque Central',
  weekdays: ['MONDAY', 'WEDNESDAY'],
  startTime: '17:00',
  endTime: '19:30',
}

/** The seller's Active listing with all 3 pairs. */
export const listingWithThreePairs: ListingDetailFixture = {
  ...ownListingDetail,
  pickupOptions: [cafe, plaza, addedPickupOption],
}

/** The seller's Active listing with a single pair. */
export const listingWithOnePair: ListingDetailFixture = {
  ...ownListingDetail,
  pickupOptions: [cafe],
}

/** The seller's listing once reserved: frozen, no pairs shown. */
export const pendingOwnListing: ListingDetailFixture = {
  ...ownListingDetail,
  status: 'PENDING',
  pickupOptions: [],
  viewer: { isSeller: true, canReserve: false, canEdit: false },
}

export const pickupOptionLimitError = {
  statusCode: 409,
  code: 'PICKUP_OPTION_LIMIT',
  message: 'A listing can have at most 3 pickup options.',
  details: null,
}

export const lastPickupOptionError = {
  statusCode: 409,
  code: 'LAST_PICKUP_OPTION',
  message: 'A listing needs at least one pickup option.',
  details: null,
}
