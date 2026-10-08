import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import {
  internalError,
  listingDetail,
  listingDetailForBuyer,
  listingNotFoundError,
  ownListingDetail,
  type ListingDetailFixture,
} from './fixtures/listings'

test.use({ viewport: { width: 375, height: 812 } })

const DETAIL = `/listings/${listingDetail.id}`

async function logIn(page: Page) {
  await page.addInitScript(
    (token) => localStorage.setItem('renest.accessToken', token),
    authResponse.accessToken,
  )
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockListing(page: Page, listing: ListingDetailFixture) {
  await page.route(`**/api/v1/listings/${listing.id}`, (route) =>
    route.fulfill({ status: 200, json: listing }),
  )
}

test('shows my Active listing with its pickup pairs', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)

  await page.goto(DETAIL)

  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()
  await expect(page.getByText('$185', { exact: true })).toBeVisible()
  const pickups = page.getByRole('region', { name: 'Tus lugares y horarios de recogida' })
  await expect(pickups.getByRole('listitem')).toHaveCount(2)
  await expect(pickups.getByText('Café Toscano, Av. Álvaro Obregón')).toBeVisible()
  await expect(pickups.getByText('los sábados · 10:00–13:00')).toBeVisible()
  await expect(pickups.getByText('los martes y jueves · 18:00–20:00')).toBeVisible()
  await expect(pickups.getByRole('button')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/listings')
})

test('points to My Listings when the listing is no longer Active', async ({ page }) => {
  await logIn(page)
  await mockListing(page, { ...ownListingDetail, status: 'PENDING', pickupOptions: [] })

  await page.goto(DETAIL)

  await expect(page.getByText('Este artículo ya no está activo')).toBeVisible()
  await expect(page.getByText('Encuéntralo en En proceso de Mis artículos.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'En proceso' })).toHaveAttribute(
    'href',
    '/listings?status=PENDING',
  )
  await expect(page.getByText('Activo', { exact: true })).toHaveCount(0)
})

test('sends another seller’s listing to the buyer view', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingDetailForBuyer)

  await page.goto(DETAIL)

  await expect(page).toHaveURL(`/items/${listingDetail.id}`)
})

test('shows a loading state while the listing loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/listings/${listingDetail.id}`, async (route) => {
    await held
    await route.fulfill({ status: 200, json: ownListingDetail })
  })

  await page.goto(DETAIL)

  await expect(page.getByRole('status').getByText('Cargando artículo…')).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
})

test('explains a listing that does not exist', async ({ page }) => {
  await logIn(page)
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )

  await page.goto(DETAIL)

  await expect(page.getByText('Este artículo no existe')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis artículos' })).toHaveAttribute('href', '/listings')
})

test('explains when the listing cannot load and lets me retry', async ({ page }) => {
  await logIn(page)
  let failing = true
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: ownListingDetail }),
  )

  await page.goto(DETAIL)

  await expect(page.getByText('No pudimos cargar el artículo')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
})
