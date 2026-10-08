import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import {
  internalError,
  listingDetailForBuyer,
  listingNotFoundError,
  type ListingDetailFixture,
} from './fixtures/listings'
import { reservationDetail } from './fixtures/reservations'

test.use({ viewport: { width: 375, height: 812 } })

const LISTING_ID = listingDetailForBuyer.id
const PICKUP = `/items/${LISTING_ID}/pickup`

async function logIn(page: Page) {
  await page.addInitScript((token) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('renest.accessToken', token)
      sessionStorage.setItem('seeded', '1')
    }
  }, authResponse.accessToken)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockListing(page: Page, listing: ListingDetailFixture = listingDetailForBuyer) {
  await page.route(`**/api/v1/listings/${listing.id}`, (route) =>
    route.fulfill({ status: 200, json: listing }),
  )
}

const confirmButton = (page: Page) => page.getByRole('button', { name: 'Confirmar recogida' })

async function chooseAndConfirm(page: Page, place: string) {
  await page.getByRole('radio', { name: new RegExp(place) }).click()
  await confirmButton(page).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, reservar' }).click()
}

test('lists the pickup pairs and keeps "Confirmar recogida" disabled until one is chosen (RES-2)', async ({ page }) => {
  await logIn(page)
  await mockListing(page)

  await page.goto(PICKUP)

  const pairs = page.getByRole('radiogroup', { name: 'Lugares y horarios de recogida' })
  await expect(pairs.getByRole('radio')).toHaveCount(2)
  await expect(pairs.getByRole('radio', { name: /Café Toscano/ })).toContainText('los sábados · 10:00–13:00')
  await expect(confirmButton(page)).toBeDisabled()

  await pairs.getByRole('radio', { name: /Plaza Principal/ }).click()

  await expect(pairs.getByRole('radio', { name: /Plaza Principal/ })).toHaveAttribute('aria-checked', 'true')
  await expect(confirmButton(page)).toBeEnabled()
})

test('asks for confirmation before reserving and does nothing on "Ahora no" (RES-3)', async ({ page }) => {
  await logIn(page)
  await mockListing(page)
  let posted = false
  await page.route('**/api/v1/reservations', (route) => {
    posted = true
    return route.fulfill({ status: 201, json: reservationDetail })
  })
  await page.goto(PICKUP)
  await page.getByRole('radio', { name: /Plaza Principal/ }).click()

  await confirmButton(page).click()
  const dialog = page.getByRole('dialog', { name: '¿Confirmar la recogida?' })
  await expect(dialog).toContainText('Plaza Principal')
  await dialog.getByRole('button', { name: 'Ahora no' }).click()

  await expect(dialog).toBeHidden()
  expect(posted).toBe(false)
})

test('reserves with the chosen pair and shows the pickup summary with Maps and WhatsApp (RES-3, RES-7)', async ({ page }) => {
  await logIn(page)
  await mockListing(page)
  let body: unknown
  await page.route('**/api/v1/reservations', (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ status: 201, json: reservationDetail })
  })
  await page.goto(PICKUP)

  await chooseAndConfirm(page, 'Plaza Principal')

  await expect(page.getByRole('heading', { name: '¡Listo, es tuyo!' })).toBeVisible()
  expect(body).toEqual({
    listingId: LISTING_ID,
    pickupOptionId: listingDetailForBuyer.pickupOptions[1].id,
  })
  await expect(page.getByText('Plaza Principal')).toBeVisible()
  await expect(page.getByText('los martes y jueves · 18:00–20:00')).toBeVisible()
  await expect(page.getByText('Priya Mehta')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mapa' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/search/?api=1&query=Plaza%20Principal',
  )
  const message =
    'Hola Priya Mehta, reservé tu "Aparador de teca mediados de siglo" en ReNest. ¿Qué día te queda bien para la recogida en Plaza Principal?'
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
    'href',
    `https://wa.me/525512345678?text=${encodeURIComponent(message)}`,
  )
})

test('"Ver más productos" returns to the feed (RES-8)', async ({ page }) => {
  await logIn(page)
  await mockListing(page)
  await page.route('**/api/v1/reservations', (route) =>
    route.fulfill({ status: 201, json: reservationDetail }),
  )
  await page.route('**/api/v1/listings?*', (route) =>
    route.fulfill({ status: 200, json: { data: [], nextCursor: null } }),
  )
  await page.route('**/api/v1/categories', (route) => route.fulfill({ status: 200, json: [] }))
  await page.goto(PICKUP)
  await chooseAndConfirm(page, 'Plaza Principal')

  await page.getByRole('link', { name: 'Ver más productos' }).click()

  await expect(page).toHaveURL('/feed')
})

test('sends a logged-out visitor to login first (RES-1)', async ({ page }) => {
  await page.goto(PICKUP)

  await expect(page).toHaveURL('/login')
})

test('sends the seller back to their listing (RES-4)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, {
    ...listingDetailForBuyer,
    viewer: { isSeller: true, canReserve: false, canEdit: true },
  })

  await page.goto(PICKUP)

  await expect(page).toHaveURL(`/items/${LISTING_ID}`)
})

test('sends back to the listing when it is no longer Active (GEN-10)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, {
    ...listingDetailForBuyer,
    status: 'PENDING',
    pickupOptions: [],
    viewer: { isSeller: false, canReserve: false, canEdit: false },
  })

  await page.goto(PICKUP)

  await expect(page).toHaveURL(`/items/${LISTING_ID}`)
  await expect(page.getByText('Ya no está disponible')).toBeVisible()
})

test('shows a loading state while the listing loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/listings/${LISTING_ID}`, async (route) => {
    await released
    await route.fulfill({ status: 200, json: listingDetailForBuyer })
  })

  await page.goto(PICKUP)

  await expect(page.getByRole('status')).toHaveText('Cargando…')
  release()
  await expect(confirmButton(page)).toBeVisible()
})

test('shows an error with a retry when the listing fails to load', async ({ page }) => {
  await logIn(page)
  let apiDown = true
  await page.route(`**/api/v1/listings/${LISTING_ID}`, (route) =>
    apiDown
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: listingDetailForBuyer }),
  )
  await page.goto(PICKUP)
  await expect(page.getByText('No pudimos cargar el artículo')).toBeVisible()

  apiDown = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('radio')).toHaveCount(2)
})

test('says the listing does not exist on 404 LISTING_NOT_FOUND', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/listings/unknown', (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )

  await page.goto('/items/unknown/pickup')

  await expect(page.getByText('Este artículo no existe')).toBeVisible()
})

test('keeps the choice and lets the buyer try again when the reservation fails', async ({ page }) => {
  await logIn(page)
  await mockListing(page)
  let apiDown = true
  await page.route('**/api/v1/reservations', (route) =>
    apiDown
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 201, json: reservationDetail }),
  )
  await page.goto(PICKUP)
  await chooseAndConfirm(page, 'Plaza Principal')
  await expect(page.getByRole('alert')).toHaveText(
    'No pudimos confirmar la reserva. Revisa tu conexión e inténtalo de nuevo.',
  )
  await expect(page.getByRole('radio', { name: /Plaza Principal/ })).toHaveAttribute('aria-checked', 'true')

  apiDown = false
  await confirmButton(page).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, reservar' }).click()

  await expect(page.getByRole('heading', { name: '¡Listo, es tuyo!' })).toBeVisible()
})
