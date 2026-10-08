// GET /listings and GET /categories payloads (API contract §2, §4).

/** 1×1 PNG so each card has a real image to load. */
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

export const categories = [
  { id: '0192d3a4-0000-7000-8000-0000000000c2', name: 'Electrónica', slug: 'electronica' },
  { id: '0192d3a4-0000-7000-8000-0000000000c3', name: 'Hogar', slug: 'hogar' },
  { id: '0192d3a4-0000-7000-8000-0000000000c1', name: 'Muebles', slug: 'muebles' },
]

export const sideboardCard = {
  id: '0192d3a4-0000-7000-8000-0000000000a1',
  title: 'Aparador de teca mediados de siglo',
  priceCents: 18500,
  condition: 'GENTLY_USED',
  category: categories[2],
  status: 'ACTIVE',
  coverPhotoUrl: PHOTO,
  city: 'COCHABAMBA_BO',
  sellerIsVerified: true,
  publishedAt: '2026-10-07T15:04:05.000Z',
}

export const lampCard = {
  ...sideboardCard,
  id: '0192d3a4-0000-7000-8000-0000000000a2',
  title: 'Lámpara de pie de latón',
  priceCents: 4250,
  condition: 'LIKE_NEW',
  category: categories[1],
  city: 'AREQUIPA_PE',
  sellerIsVerified: false,
  publishedAt: '2026-10-06T09:00:00.000Z',
}

/** `count` cards titled "Artículo <start>"…, for paging. */
export function cards(count: number, start = 1) {
  return Array.from({ length: count }, (_, i) => ({
    ...sideboardCard,
    id: `0192d3a4-0000-7000-8000-${String(start + i).padStart(12, '0')}`,
    title: `Artículo ${start + i}`,
  }))
}

export function feedPage(data: object[], nextCursor: string | null = null) {
  return { data, nextCursor }
}

export const internalError = {
  statusCode: 500,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
  details: null,
}
