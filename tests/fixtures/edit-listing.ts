// PATCH /listings/:listingId payloads (API contract §5).

export const listingNotEditableError = {
  statusCode: 409,
  code: 'LISTING_NOT_EDITABLE',
  message: 'This listing was already reserved and can no longer be edited.',
  details: null,
}

export const photoValidationError = {
  statusCode: 400,
  code: 'VALIDATION_ERROR',
  message: 'Validation failed.',
  details: [{ field: 'photos[0].photoId', message: 'photoId must be a UUID' }],
}

export const notListingOwnerError = {
  statusCode: 403,
  code: 'NOT_LISTING_OWNER',
  message: 'You can only edit your own listings.',
  details: null,
}
