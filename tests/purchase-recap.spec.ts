import { expect, test, type Page } from './fixtures/test'
import { internalError } from './fixtures/listings'
import {
  RESERVATION_ID,
  receptionChecklist,
  reservationDetail,
  reservationNotFoundError,
  type ReservationDetailFixture,
} from './fixtures/purchases'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const RECAP = `/purchases/${RESERVATION_ID}`

async function mockReservation(page: Page, detail: ReservationDetailFixture) {
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 200, json: detail }),
  )
}

const received = {
  ...reservationDetail,
  buyerReceivedAt: '2026-10-09T12:00:00.000Z',
  receptionChecklist,
}

test('shows the item, the seller with WhatsApp, the pickup pair and a Maps link (PUR-3)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, reservationDetail)

  await page.goto(RECAP)

  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(page.getByText('$185')).toBeVisible()
  await expect(page.getByText('Priya Mehta')).toBeVisible()
  await expect(page.getByText('Café Toscano, Av. Álvaro Obregón')).toBeVisible()
  await expect(page.getByText('los sábados · 10:00–13:00')).toBeVisible()
  const whatsapp = page.getByRole('link', { name: 'WhatsApp' })
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/525512345678\?text=/)
  const text = new URL((await whatsapp.getAttribute('href'))!).searchParams.get('text')
  expect(text).toBe(
    'Hola Priya Mehta, reservé tu "Aparador de teca mediados de siglo" en ReNest. ¿Qué día te queda bien para la recogida en Café Toscano, Av. Álvaro Obregón?',
  )
  await expect(whatsapp).toHaveAttribute('target', '_blank')
  await expect(page.getByRole('link', { name: 'Mapa' })).toHaveAttribute(
    'href',
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Café Toscano, Av. Álvaro Obregón')}`,
  )
})

test('offers "Marcar como recogido" while reception is not confirmed (PUR-4)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, reservationDetail)
  await page.goto(RECAP)

  await page.getByRole('link', { name: 'Marcar como recogido' }).click()

  await expect(page).toHaveURL(`${RECAP}/checklist`)
})

test('keeps "Marcar como recogido" when the seller already confirmed the handover (PUR-2, PUR-4)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, {
    ...reservationDetail,
    sellerHandedOverAt: '2026-10-09T12:00:00.000Z',
  })

  await page.goto(RECAP)

  await expect(page.getByText('El vendedor confirmó la entrega')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Marcar como recogido' })).toBeVisible()
})

test('offers "Calificar al vendedor" once reception is confirmed and there is no rating (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, {
    ...received,
    actions: { canConfirmHandover: false, canConfirmReception: false, canRate: true },
  })
  await page.goto(RECAP)

  await expect(page.getByRole('link', { name: 'Marcar como recogido' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Calificar al vendedor' }).click()

  await expect(page).toHaveURL(`${RECAP}/rate`)
})

test('shows no action once the purchase is completed and rated (PUR-8)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, {
    ...received,
    rating: { stars: 5, createdAt: '2026-10-09T12:05:00.000Z' },
    actions: { canConfirmHandover: false, canConfirmReception: false, canRate: false },
  })

  await page.goto(RECAP)

  await expect(page.getByText('Completado')).toBeVisible()
  await expect(page.getByRole('link', { name: /Marcar como recogido|Calificar/ })).toHaveCount(0)
})

test("says it doesn't exist for another user's purchase id (404)", async ({ page }) => {
  await logIn(page)
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 404, json: reservationNotFoundError }),
  )

  await page.goto(RECAP)

  await expect(page.getByText('Esta compra no existe')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis compras' })).toHaveAttribute('href', '/purchases')
})

test('sends the seller of the reservation to their sale detail, replacing the recap', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/me/purchases?*', (route) => route.fulfill({ status: 200, json: [] }))
  await mockReservation(page, { ...reservationDetail, viewerRole: 'SELLER' })
  await page.goto('/purchases')

  await page.goto(RECAP)
  await expect(page).toHaveURL(`/sales/${RESERVATION_ID}`)

  // Back skips the recap instead of bouncing to the sale again.
  await page.goBack()
  await expect(page).toHaveURL('/purchases')
})

test('shows a loading state, then an error with retry', async ({ page }) => {
  await logIn(page)
  let fail = true
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, async (route) => {
    await held
    if (fail) return route.fulfill({ status: 500, json: internalError })
    return route.fulfill({ status: 200, json: reservationDetail })
  })

  await page.goto(RECAP)
  await expect(page.getByRole('status')).toHaveText('Cargando…')
  release()
  await expect(page.getByText('No pudimos cargar la compra')).toBeVisible()

  fail = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('heading', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
})

test('goes back to my purchases from the header', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, reservationDetail)
  await page.goto(RECAP)

  await expect(page.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/purchases')
})
