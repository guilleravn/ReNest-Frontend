import { expect, test, type Page } from '@playwright/test'
import { authResponse, unauthorizedError } from './fixtures/auth'
import { internalError } from './fixtures/listings'
import {
  RESERVATION_ID,
  receptionAlreadyConfirmedError,
  receivedReservationDetail,
  reservationDetail,
  reservationNotFoundError,
} from './fixtures/purchases'

test.use({ viewport: { width: 375, height: 812 } })

const RECAP = `/purchases/${RESERVATION_ID}`
const CHECKLIST = `${RECAP}/checklist`
const RECEPTION_URL = `**/api/v1/reservations/${RESERVATION_ID}/reception`

async function logIn(page: Page) {
  await page.addInitScript((token) => localStorage.setItem('renest.accessToken', token), authResponse.accessToken)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockReservation(page: Page, detail: object = reservationDetail) {
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 200, json: detail }),
  )
}

/**
 * Answers POST …/reception with `status`/`json` and records the bodies sent.
 * Once confirmed, the purchase loads as receivedReservationDetail, so the rating step opens.
 */
async function mockReception(page: Page, status = 200, json: object = receivedReservationDetail) {
  const bodies: unknown[] = []
  await page.route(RECEPTION_URL, async (route) => {
    bodies.push(route.request().postDataJSON())
    if (status === 200) await mockReservation(page, json)
    return route.fulfill({ status, json })
  })
  return bodies
}

const confirmButton = (page: Page) => page.getByRole('button', { name: 'Confirmar recepción' })

test('shows the three yes/no items, "Tengo el artículo" and the optional report (PUR-5)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)

  await page.goto(CHECKLIST)

  await expect(page.getByRole('heading', { name: '¿Cómo recibiste el artículo?' })).toBeVisible()
  await expect(page.getByText('Aparador de teca mediados de siglo')).toBeVisible()
  const items = page.getByRole('group', { name: 'Marca lo que se cumple' })
  for (const label of [
    'El artículo coincide con las fotos y la descripción',
    'Funciona / sin daños no informados',
    'Incluye todas las partes y accesorios',
  ]) {
    await expect(items.getByRole('button', { name: label, pressed: false })).toBeVisible()
  }
  await expect(page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' })).not.toBeChecked()
  await expect(page.getByLabel('¿Algo que quieras reportar?')).toHaveAttribute('maxlength', '1000')
  await expect(page.getByText('0/1000')).toBeVisible()
})

test('keeps "Confirmar recepción" disabled until "Tengo el artículo conmigo ahora" is checked (PUR-5)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await page.goto(CHECKLIST)

  await expect(confirmButton(page)).toBeDisabled()
  await expect(page.getByText('Marca “Tengo el artículo conmigo ahora” para continuar.')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()

  await expect(confirmButton(page)).toBeEnabled()
})

test('sends unchecked items as false and goes to the rating step (PUR-6)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  const bodies = await mockReception(page)
  await page.goto(CHECKLIST)

  const allParts = 'Incluye todas las partes y accesorios'
  await page.getByRole('button', { name: allParts }).click()
  await expect(page.getByRole('button', { name: allParts, pressed: true })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await confirmButton(page).click()

  await expect(page).toHaveURL(`${RECAP}/rate`)
  expect(bodies).toEqual([
    {
      matchesListing: false,
      worksNoUndisclosedDamage: false,
      allPartsIncluded: true,
      hasItemNow: true,
      issueReport: null,
    },
  ])
})

test('sends the report trimmed and counts its characters (PUR-5)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  const bodies = await mockReception(page)
  await page.goto(CHECKLIST)

  await page.getByLabel('¿Algo que quieras reportar?').fill('  Tiene un rayón.  ')
  await expect(page.getByText('19/1000')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await confirmButton(page).click()

  await expect(page).toHaveURL(`${RECAP}/rate`)
  expect(bodies).toEqual([expect.objectContaining({ issueReport: 'Tiene un rayón.' })])
})

test('works after the seller confirmed the handover (PUR-4)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, {
    ...reservationDetail,
    sellerHandedOverAt: '2026-10-09T11:00:00.000Z',
  })
  await mockReception(page)
  await page.goto(CHECKLIST)

  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await confirmButton(page).click()

  await expect(page).toHaveURL(`${RECAP}/rate`)
})

test('goes back to the recap when reception is already confirmed (PUR-7)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, receivedReservationDetail)

  await page.goto(CHECKLIST)

  await expect(page).toHaveURL(RECAP)
  await expect(page.getByRole('link', { name: 'Calificar al vendedor' })).toBeVisible()
})

test('explains a 409 RECEPTION_ALREADY_CONFIRMED and links back to the purchase (PUR-7)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await mockReception(page, 409, receptionAlreadyConfirmedError)
  await page.goto(CHECKLIST)

  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await confirmButton(page).click()

  await expect(page.getByText('Ya confirmaste la recepción')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver la compra' })).toHaveAttribute('href', RECAP)
})

test('shows an error and keeps the answers when the confirmation fails', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await mockReception(page, 500, internalError)
  await page.goto(CHECKLIST)

  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await confirmButton(page).click()

  await expect(page.getByText('No pudimos confirmar la recepción. Inténtalo de nuevo.')).toBeVisible()
  await expect(page).toHaveURL(CHECKLIST)
  await expect(page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' })).toBeChecked()
  await expect(confirmButton(page)).toBeEnabled()
})

test('sends me to login when my session expired while confirming (401)', async ({ page }) => {
  await logIn(page)
  await mockReservation(page)
  await mockReception(page, 401, unauthorizedError)
  await page.goto(CHECKLIST)

  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await confirmButton(page).click()

  await expect(page).toHaveURL(/\/login/)
})

test('shows a loading state while the purchase loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, async (route) => {
    await held
    await route.fulfill({ status: 200, json: reservationDetail })
  })

  await page.goto(CHECKLIST)

  await expect(page.getByRole('status')).toHaveText('Cargando…')
  release()
  await expect(page.getByRole('heading', { name: '¿Cómo recibiste el artículo?' })).toBeVisible()
})

test('offers a retry when the purchase fails to load', async ({ page }) => {
  await logIn(page)
  let down = true
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    down
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: reservationDetail }),
  )
  await page.goto(CHECKLIST)

  await expect(page.getByText('No pudimos cargar la compra')).toBeVisible()
  down = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('heading', { name: '¿Cómo recibiste el artículo?' })).toBeVisible()
})

test("says it doesn't exist for another user's purchase id (404)", async ({ page }) => {
  await logIn(page)
  await page.route(`**/api/v1/reservations/${RESERVATION_ID}`, (route) =>
    route.fulfill({ status: 404, json: reservationNotFoundError }),
  )

  await page.goto(CHECKLIST)

  await expect(page.getByText('Esta compra no existe')).toBeVisible()
  await expect(confirmButton(page)).toHaveCount(0)
})

test('sends the seller of the reservation to their sale detail', async ({ page }) => {
  await logIn(page)
  await mockReservation(page, { ...reservationDetail, viewerRole: 'SELLER' })

  await page.goto(CHECKLIST)

  await expect(page).toHaveURL(`/sales/${RESERVATION_ID}`)
})
