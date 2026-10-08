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
