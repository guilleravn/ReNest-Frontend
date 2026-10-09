import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { RESERVATION_ID, receivedReservationDetail } from './fixtures/purchases'

test.use({ viewport: { width: 375, height: 812 } })

const RECAP = `/purchases/${RESERVATION_ID}`
const RATE = `${RECAP}/rate`
const THANKS = `${RECAP}/thanks`

async function logIn(page: Page) {
  await page.addInitScript((token) => localStorage.setItem('renest.accessToken', token), authResponse.accessToken)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockRateStep(page: Page) {
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 200, json: receivedReservationDetail }),
  )
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}/rating`, (route) =>
    route.fulfill({ status: 201, json: { stars: 5, createdAt: '2026-10-09T12:05:00.000Z' } }),
  )
}

const skipHint = (page: Page) => page.getByText(/Puedes calificar a Priya Mehta cuando quieras/)

test('thanks me for rating the seller after rating (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockRateStep(page)
  await page.goto(RATE)

  await page.getByRole('radio', { name: '5 estrellas' }).click()
  await page.getByRole('button', { name: 'Enviar calificación' }).click()

  await expect(page).toHaveURL(THANKS)
  await expect(page.getByRole('heading', { name: 'Intercambio completado' })).toBeVisible()
  await expect(page.getByText('La recogida está confirmada. Gracias por hacerlo en ReNest.')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Gracias por calificar a Priya Mehta' })).toBeVisible()
  await expect(skipHint(page)).toHaveCount(0)
})

test('tells me where to rate later after skipping (PUR-9)', async ({ page }) => {
  await logIn(page)
  await mockRateStep(page)
  await page.goto(RATE)

  await page.getByRole('link', { name: 'Omitir por ahora' }).click()

  await expect(page).toHaveURL(THANKS)
  await expect(page.getByRole('heading', { name: 'Intercambio completado' })).toBeVisible()
  await expect(skipHint(page)).toBeVisible()
  await expect(page.getByRole('link', { name: 'resumen de tu compra' })).toHaveAttribute('href', RECAP)
  await expect(page.getByText('Gracias por calificar a Priya Mehta')).toHaveCount(0)
})

test('shows the confirmation without the rating notes when opened directly', async ({ page }) => {
  await logIn(page)

  await page.goto(THANKS)

  await expect(page.getByRole('heading', { name: 'Intercambio completado' })).toBeVisible()
  await expect(skipHint(page)).toHaveCount(0)
  await expect(page.getByText(/Gracias por calificar/)).toHaveCount(0)
})

test('leads to my purchases, the feed and back to the recap', async ({ page }) => {
  await logIn(page)

  await page.goto(THANKS)

  await expect(page.getByRole('link', { name: 'Volver a Mis compras' })).toHaveAttribute('href', '/purchases')
  await expect(page.getByRole('link', { name: 'Seguir explorando' })).toHaveAttribute('href', '/feed')
  await expect(page.getByRole('link', { name: 'Volver', exact: true })).toHaveAttribute('href', RECAP)
})

test("doesn't go back to the rating step after rating", async ({ page }) => {
  await logIn(page)
  await mockRateStep(page)
  await page.goto(RECAP)
  await page.getByRole('link', { name: 'Calificar al vendedor' }).click()
  await page.getByRole('radio', { name: '4 estrellas' }).click()
  await page.getByRole('button', { name: 'Enviar calificación' }).click()
  await expect(page).toHaveURL(THANKS)

  await page.goBack()

  await expect(page).toHaveURL(RECAP)
})

test('fits a 375px screen without horizontal scroll', async ({ page }) => {
  await logIn(page)

  await page.goto(THANKS)

  await expect(page.getByRole('heading', { name: 'Intercambio completado' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
