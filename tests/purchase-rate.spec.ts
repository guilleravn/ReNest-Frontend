import { expect, test, type Page } from '@playwright/test'
import { authResponse, unauthorizedError } from './fixtures/auth'
import { internalError } from './fixtures/listings'
import {
  RESERVATION_ID,
  alreadyRatedError,
  receptionChecklist,
  reservationDetail,
  reservationNotFoundError,
} from './fixtures/purchases'

test.use({ viewport: { width: 375, height: 812 } })

const RECAP = `/purchases/${RESERVATION_ID}`
const RATE = `${RECAP}/rate`
const THANKS = `${RECAP}/thanks`
const RATING_URL = `**/api/v1/reservations/${RESERVATION_ID}/rating`

const received = {
  ...reservationDetail,
  buyerReceivedAt: '2026-10-09T12:00:00.000Z',
  receptionChecklist,
  actions: { canConfirmHandover: false, canConfirmReception: false, canRate: true },
}

async function logIn(page: Page) {
  await page.addInitScript((token) => localStorage.setItem('renest.accessToken', token), authResponse.accessToken)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockReservation(page: Page, detail: object = received) {
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 200, json: detail }),
  )
}

/** Answers POST …/rating with `status`/`json` and records the bodies sent. */
async function mockRating(
  page: Page,
  status = 201,
  json: object = { stars: 4, createdAt: '2026-10-09T12:05:00.000Z' },
) {
  const bodies: unknown[] = []
  await page.route(RATING_URL, (route) => {
    bodies.push(route.request().postDataJSON())
    return route.fulfill({ status, json })
  })
  return bodies
}

const sendButton = (page: Page) => page.getByRole('button', { name: 'Enviar calificación' })

test('asks how it went with the seller with five stars (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)

  await page.goto(RATE)

  await expect(page.getByRole('heading', { name: '¿Cómo te fue con Priya Mehta?' })).toBeVisible()
  const stars = page.getByRole('radiogroup', { name: 'Califica al vendedor del 1 al 5' })
  await expect(stars.getByRole('radio')).toHaveCount(5)
  await expect(page.getByRole('textbox')).toHaveCount(0)
})

test('keeps "Enviar calificación" disabled until a star is chosen (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await page.goto(RATE)

  await expect(sendButton(page)).toBeDisabled()
  await page.getByRole('radio', { name: '4 estrellas' }).click()

  await expect(page.getByRole('radio', { name: '4 estrellas' })).toBeChecked()
  await expect(sendButton(page)).toBeEnabled()
})

test('sends the stars and goes to the thanks screen (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  const bodies = await mockRating(page)
  await page.goto(RATE)

  await page.getByRole('radio', { name: '4 estrellas' }).click()
  await sendButton(page).click()

  await expect(page).toHaveURL(THANKS)
  expect(bodies).toEqual([{ stars: 4 }])
})

test('skips to the thanks screen without rating (PUR-9)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  const bodies = await mockRating(page)
  await page.goto(RATE)

  await page.getByRole('link', { name: 'Omitir por ahora' }).click()

  await expect(page).toHaveURL(THANKS)
  expect(bodies).toEqual([])
})

test('still offers the rating from the recap after skipping (PUR-9)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await page.goto(RATE)
  await page.getByRole('link', { name: 'Omitir por ahora' }).click()
  await expect(page).toHaveURL(THANKS)

  await page.goto(RECAP)
  await page.getByRole('link', { name: 'Calificar al vendedor' }).click()

  await expect(page).toHaveURL(RATE)
  await expect(page.getByRole('heading', { name: '¿Cómo te fue con Priya Mehta?' })).toBeVisible()
})

test('goes back to the recap before reception is confirmed (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, reservationDetail)

  await page.goto(RATE)

  await expect(page).toHaveURL(RECAP)
  await expect(page.getByRole('link', { name: 'Marcar como recogido' })).toBeVisible()
})

test('goes back to the recap when the seller is already rated (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, {
    ...received,
    rating: { stars: 5, createdAt: '2026-10-09T12:05:00.000Z' },
    actions: { ...received.actions, canRate: false },
  })

  await page.goto(RATE)

  await expect(page).toHaveURL(RECAP)
  await expect(page.getByRole('link', { name: 'Calificar al vendedor' })).toHaveCount(0)
})

test('explains a 409 ALREADY_RATED and links back to the purchase (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await mockRating(page, 409, alreadyRatedError)
  await page.goto(RATE)

  await page.getByRole('radio', { name: '5 estrellas' }).click()
  await sendButton(page).click()

  await expect(page.getByText('Ya calificaste a este vendedor')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver la compra' })).toHaveAttribute('href', RECAP)
})

test('shows an error and keeps the stars when the rating fails', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await mockRating(page, 500, internalError)
  await page.goto(RATE)

  await page.getByRole('radio', { name: '3 estrellas' }).click()
  await sendButton(page).click()

  await expect(page.getByText('No pudimos enviar tu calificación. Inténtalo de nuevo.')).toBeVisible()
  await expect(page).toHaveURL(RATE)
  await expect(page.getByRole('radio', { name: '3 estrellas' })).toBeChecked()
  await expect(sendButton(page)).toBeEnabled()
})

test('sends me to login when my session expired while rating (401)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await mockRating(page, 401, unauthorizedError)
  await page.goto(RATE)

  await page.getByRole('radio', { name: '5 estrellas' }).click()
  await sendButton(page).click()

  await expect(page).toHaveURL(/\/login/)
})

test('shows a loading state while the purchase loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, async (route) => {
    await held
    await route.fulfill({ status: 200, json: received })
  })

  await page.goto(RATE)

  await expect(page.getByRole('status')).toHaveText('Cargando…')
  release()
  await expect(page.getByRole('heading', { name: '¿Cómo te fue con Priya Mehta?' })).toBeVisible()
})

test('offers a retry when the purchase fails to load', async ({ page }) => {
  await logIn(page)
  let down = true
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    down
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: received }),
  )
  await page.goto(RATE)

  await expect(page.getByText('No pudimos cargar la compra')).toBeVisible()
  down = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('heading', { name: '¿Cómo te fue con Priya Mehta?' })).toBeVisible()
})

test("says it doesn't exist for another user's purchase id (404)", async ({ page }) => {
  await logIn(page)
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 404, json: reservationNotFoundError }),
  )

  await page.goto(RATE)

  await expect(page.getByText('Esta compra no existe')).toBeVisible()
  await expect(sendButton(page)).toHaveCount(0)
})

test("doesn't offer the rating to the seller of the reservation", async ({ page }) => {
  await logIn(page)
  await mockReservation(page, { ...received, viewerRole: 'SELLER' })

  await page.goto(RATE)

  await expect(page.getByText('Esta compra no existe')).toBeVisible()
  await expect(sendButton(page)).toHaveCount(0)
})
