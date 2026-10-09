import { expect, test } from './fixtures/test'
import {
  internalError,
  listingNotFoundError,
  ownListingDetail,
  type ListingDetailFixture,
} from './fixtures/listings'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const soldListing: ListingDetailFixture = {
  ...ownListingDetail,
  status: 'COMPLETED',
  pickupOptions: [],
  viewer: { isSeller: true, canReserve: false, canEdit: false },
}

const PAGE = `/listings/${soldListing.id}/sale-completed`
const API = `**/api/v1/listings/${soldListing.id}`

test('celebrates the sale and reminds me the buyer can still confirm and rate (SAL-4, PUR-2)', async ({ page }) => {
  await logIn(page)
  await page.route(API, (route) => route.fulfill({ status: 200, json: soldListing }))

  await page.goto(PAGE)

  await expect(page.getByRole('heading', { name: '¡Venta completada!' })).toBeVisible()
  await expect(page.getByText('Aparador de teca mediados de siglo')).toBeVisible()
  await expect(page.getByText(/el comprador todavía puede confirmar la recepción y calificarte/i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis completados' })).toHaveAttribute(
    'href',
    '/listings?status=COMPLETED',
  )
})

test('sends me to the listing when it is not completed yet', async ({ page }) => {
  await logIn(page)
  await page.route(API, (route) =>
    route.fulfill({ status: 200, json: { ...soldListing, status: 'PENDING' } }),
  )

  await page.goto(PAGE)

  await expect(page).toHaveURL(`/listings/${soldListing.id}`)
})

test('shows a loading state while the listing loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(API, async (route) => {
    await held
    await route.fulfill({ status: 200, json: soldListing })
  })

  await page.goto(PAGE)

  await expect(page.getByRole('status').getByText('Cargando…')).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: '¡Venta completada!' })).toBeVisible()
})

test('explains a listing that does not exist or is not mine', async ({ page }) => {
  await logIn(page)
  await page.route(API, (route) => route.fulfill({ status: 404, json: listingNotFoundError }))

  await page.goto(PAGE)

  await expect(page.getByText('Esta venta no existe')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis artículos' })).toHaveAttribute(
    'href',
    '/listings',
  )
})

test('treats a listing of someone else as not found', async ({ page }) => {
  await logIn(page)
  await page.route(API, (route) =>
    route.fulfill({
      status: 200,
      json: { ...soldListing, viewer: { isSeller: false, canReserve: false, canEdit: false } },
    }),
  )

  await page.goto(PAGE)

  await expect(page.getByText('Esta venta no existe')).toBeVisible()
})

test('explains when the listing cannot load and lets me retry', async ({ page }) => {
  await logIn(page)
  let failing = true
  await page.route(API, (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: soldListing }),
  )

  await page.goto(PAGE)

  await expect(page.getByText('No pudimos cargar la venta')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: '¡Venta completada!' })).toBeVisible()
})
