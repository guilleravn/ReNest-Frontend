import { expect, test, type Page } from '@playwright/test'
import { unauthorizedError } from './fixtures/auth'
import {
  internalError,
  listingDetail,
  listingDetailForBuyer,
  listingNotFoundError,
  type ListingDetailFixture,
} from './fixtures/listings'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const DETAIL = `/items/${listingDetail.id}`

async function mockListing(page: Page, listing: ListingDetailFixture) {
  await page.route(`**/api/v1/listings/${listing.id}`, (route) =>
    route.fulfill({ status: 200, json: listing }),
  )
}

test('shows photos, price, condition, category, description and pickup pairs (BRW-5)', async ({ page }) => {
  await mockListing(page, listingDetail)

  await page.goto(DETAIL)

  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(page.getByText('Muebles · Poco uso')).toBeVisible()
  await expect(page.getByText('$185', { exact: true })).toBeVisible()
  await expect(page.getByText('Teca maciza, tres cajones')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Foto \d$/ })).toHaveCount(3)
  const pickups = page.getByRole('region', { name: 'Lugares y horarios de recogida' })
  await expect(pickups.getByRole('listitem')).toHaveCount(2)
  await expect(pickups.getByText('Café Toscano, Av. Álvaro Obregón')).toBeVisible()
  await expect(pickups.getByText('los sábados · 10:00–13:00')).toBeVisible()
  await expect(pickups.getByText('los martes y jueves · 18:00–20:00')).toBeVisible()
})

test('shows the seller snapshot: name, initials, verified badge, rating and city (BRW-6)', async ({ page }) => {
  await mockListing(page, listingDetail)

  await page.goto(DETAIL)

  const seller = page.getByRole('region', { name: 'Vendedor' })
  await expect(seller.getByText('Priya Mehta')).toBeVisible()
  await expect(seller.getByText('P', { exact: true })).toBeVisible()
  await expect(seller.getByText('Vendedor verificado')).toBeVisible()
  await expect(seller.getByText('4,9 · 63 reseñas')).toBeVisible()
  await expect(seller.getByText('Cochabamba, BO')).toBeVisible()
})

test('shows "Sin calificaciones aún" instead of 0.0 when the seller has no ratings (BRW-6)', async ({ page }) => {
  await mockListing(page, {
    ...listingDetail,
    seller: { ...listingDetail.seller, isVerified: false, rating: { average: null, count: 0 } },
  } as ListingDetailFixture)

  await page.goto(DETAIL)

  const seller = page.getByRole('region', { name: 'Vendedor' })
  await expect(seller.getByText('Sin calificaciones aún')).toBeVisible()
  await expect(seller.getByText(/0,0|reseña/)).toHaveCount(0)
  await expect(seller.getByText('Vendedor verificado')).toHaveCount(0)
})

test('lets a logged-in buyer schedule a pickup or ask the seller a question (BRW-7)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingDetailForBuyer)

  await page.goto(DETAIL)

  await expect(page.getByRole('button', { name: 'Mi cuenta' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Agendar recogida' })).toHaveAttribute(
    'href',
    `${DETAIL}/pickup`,
  )
  await page.getByRole('link', { name: '¿Preguntas sobre este producto?' }).click()
  await expect(page).toHaveURL(`${DETAIL}/contact`)
})

test('sends a logged-out visitor to login when asking a question, then back (BRW-7, GEN-7)', async ({ page }) => {
  await mockListing(page, listingDetail)
  await page.goto(DETAIL)
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mis compras' })).toHaveCount(0)

  await page.getByRole('link', { name: '¿Preguntas sobre este producto?' }).click()

  await expect(page).toHaveURL("/login")
})

test('treats a session the API rejects as a visitor instead of sending to login (GEN-5)', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 401, json: unauthorizedError }),
  )
  await mockListing(page, listingDetail)

  await page.goto(DETAIL)

  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(page).toHaveURL(DETAIL)
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()
})

for (const [status, note] of [
  ['PENDING', 'Otra persona ya lo reservó.'],
  ['COMPLETED', 'Este artículo ya se vendió.'],
] as const) {
  test(`still opens a ${status} listing, says it is no longer available and hides "Agendar recogida" (BRW-8)`, async ({ page }) => {
    await logIn(page)
    await mockListing(page, {
      ...listingDetailForBuyer,
      status,
      pickupOptions: [],
      viewer: { isSeller: false, canReserve: false, canEdit: false },
    })

    await page.goto(DETAIL)

    await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
    await expect(page.getByText('Ya no está disponible')).toBeVisible()
    await expect(page.getByText(note)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Agendar recogida' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Lugares y horarios de recogida' })).toHaveCount(0)
  })
}

test('does not offer "Agendar recogida" to the seller of the listing (BRW-9)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, {
    ...listingDetailForBuyer,
    viewer: { isSeller: true, canReserve: false, canEdit: true },
  })

  await page.goto(DETAIL)

  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Agendar recogida' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '¿Preguntas sobre este producto?' })).toHaveCount(0)
})

test('shows a loading state while the listing loads', async ({ page }) => {
  let respond: () => void = () => {}
  await page.route(`**/api/v1/listings/${listingDetail.id}`, async (route) => {
    await new Promise<void>((resolve) => (respond = resolve))
    await route.fulfill({ status: 200, json: listingDetail })
  })

  await page.goto(DETAIL)

  await expect(page.getByRole('status')).toHaveText('Cargando artículo…')
  respond()
  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
})

test('shows an error with a retry when the listing fails to load', async ({ page }) => {
  let apiDown = true
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    apiDown
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: listingDetail }),
  )
  await page.goto(DETAIL)
  await expect(page.getByText('No pudimos cargar el artículo')).toBeVisible()

  apiDown = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
})

test('says the listing does not exist on 404 LISTING_NOT_FOUND', async ({ page }) => {
  await page.route('**/api/v1/listings/unknown', (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )

  await page.goto('/items/unknown')

  await expect(page.getByText('Este artículo no existe')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver artículos' })).toHaveAttribute('href', '/feed')
})
