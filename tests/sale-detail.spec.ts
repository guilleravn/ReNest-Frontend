import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { internalError, ownListingDetail } from './fixtures/listings'
import {
  completedSale,
  handoverAlreadyConfirmedError,
  pendingSale,
  reservationNotFoundError,
  unauthorizedError,
  type SaleFixture,
} from './fixtures/reservations'

test.use({ viewport: { width: 375, height: 812 } })

const SALE = `/sales/${pendingSale.id}`
const API = `**/api/v1/reservations/${pendingSale.id}`

async function logIn(page: Page) {
  await page.addInitScript(
    (token) => localStorage.setItem('renest.accessToken', token),
    authResponse.accessToken,
  )
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockSale(page: Page, sale: SaleFixture) {
  await page.route(API, (route) => route.fulfill({ status: 200, json: sale }))
}

test('shows a Pending sale: buyer, WhatsApp, pickup pair, Maps and "Confirmar entrega" (SAL-3)', async ({ page }) => {
  await logIn(page)
  await mockSale(page, pendingSale)

  await page.goto(SALE)

  await expect(page.getByRole('heading', { name: 'Bicicleta urbana rodado 28' })).toBeVisible()
  await expect(page.getByText('Recogida agendada')).toBeVisible()
  const buyer = page.getByRole('region', { name: 'Comprador' })
  await expect(buyer.getByText('Andrés Pérez')).toBeVisible()
  await expect(buyer.getByText('Café Toscano, Av. Álvaro Obregón')).toBeVisible()
  await expect(buyer.getByText('los sábados · 10:00–13:00')).toBeVisible()
  const whatsapp = buyer.getByRole('link', { name: 'WhatsApp' })
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/51987654321\?text=/)
  await expect(whatsapp).toHaveAttribute('href', /Bicicleta%20urbana%20rodado%2028/)
  await expect(buyer.getByRole('link', { name: 'Mapa' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20Toscano%2C%20Av.%20%C3%81lvaro%20Obreg%C3%B3n',
  )
  await expect(page.getByText('1 de octubre de 2026')).toBeVisible()
  await expect(page.getByText('Entregado el')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toBeEnabled()
  await expect(page.getByRole('link', { name: 'Volver' })).toHaveAttribute(
    'href',
    '/listings?status=PENDING',
  )
})

test('shows a Completed sale record: buyer, pickup pair, reservation and handover dates (SAL-5)', async ({ page }) => {
  await logIn(page)
  await mockSale(page, completedSale)

  await page.goto(SALE)

  await expect(page.getByText('Venta completada')).toBeVisible()
  const buyer = page.getByRole('region', { name: 'Comprador' })
  await expect(buyer.getByText('Andrés Pérez')).toBeVisible()
  await expect(buyer.getByText('Café Toscano, Av. Álvaro Obregón')).toBeVisible()
  await expect(buyer.getByText('los sábados · 10:00–13:00')).toBeVisible()
  await expect(page.getByText('Registro de la venta')).toBeVisible()
  await expect(page.getByRole('term').filter({ hasText: 'Reservado el' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: '1 de octubre de 2026' })).toBeVisible()
  await expect(page.getByRole('term').filter({ hasText: 'Entregado el' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: '3 de octubre de 2026' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Volver' })).toHaveAttribute(
    'href',
    '/listings?status=COMPLETED',
  )
})

test('sends the buyer of the reservation to their purchase recap', async ({ page }) => {
  await logIn(page)
  await mockSale(page, { ...pendingSale, viewerRole: 'BUYER' })

  await page.goto(SALE)

  await expect(page).toHaveURL(`/purchases/${pendingSale.id}`)
})

test('hides "Confirmar entrega" when the API says the handover is not available', async ({ page }) => {
  await logIn(page)
  await mockSale(page, {
    ...pendingSale,
    actions: { ...pendingSale.actions, canConfirmHandover: false },
  })

  await page.goto(SALE)

  await expect(page.getByText('Recogida agendada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toHaveCount(0)
})

test('shows a loading state while the sale loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(API, async (route) => {
    await held
    await route.fulfill({ status: 200, json: pendingSale })
  })

  await page.goto(SALE)

  await expect(page.getByRole('status').getByText('Cargando venta…')).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: 'Bicicleta urbana rodado 28' })).toBeVisible()
})

test('explains a sale that does not exist or is not mine (GEN-7)', async ({ page }) => {
  await logIn(page)
  await page.route(API, (route) => route.fulfill({ status: 404, json: reservationNotFoundError }))

  await page.goto(SALE)

  await expect(page.getByText('Esta venta no existe')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis artículos' })).toHaveAttribute(
    'href',
    '/listings',
  )
})

test('explains when the sale cannot load and lets me retry', async ({ page }) => {
  await logIn(page)
  let failing = true
  await page.route(API, (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: pendingSale }),
  )

  await page.goto(SALE)

  await expect(page.getByText('No pudimos cargar la venta')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Bicicleta urbana rodado 28' })).toBeVisible()
})

test('sends me to login when my session expired', async ({ page }) => {
  await logIn(page)
  await page.route(API, (route) =>
    route.fulfill({
      status: 401,
      json: { statusCode: 401, code: 'UNAUTHORIZED', message: 'Expired', details: null },
    }),
  )

  await page.goto(SALE)

  await expect(page).toHaveURL(/\/login/)
})

test.describe('confirming the handover (SAL-4)', () => {
  const HANDOVER = `${API}/handover`

  test('asks for confirmation in a modal and does nothing when I back out', async ({ page }) => {
    await logIn(page)
    await mockSale(page, pendingSale)
    let posted = false
    await page.route(HANDOVER, (route) => {
      posted = true
      return route.fulfill({ status: 200, json: completedSale })
    })

    await page.goto(SALE)
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()

    const dialog = page.getByRole('dialog', { name: '¿Confirmar la entrega?' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/El artículo pasará a Completados\./)).toBeVisible()
    await dialog.getByRole('button', { name: 'Ahora no' }).click()
    await expect(dialog).toBeHidden()
    expect(posted).toBe(false)
  })

  test('confirms the handover and lands on "Venta completada"', async ({ page }) => {
    await logIn(page)
    await mockSale(page, pendingSale)
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    let method: string | undefined
    await page.route(HANDOVER, async (route) => {
      method = route.request().method()
      await held
      await route.fulfill({ status: 200, json: completedSale })
    })
    await page.route(`**/api/v1/listings/${pendingSale.listing.id}`, (route) =>
      route.fulfill({
        status: 200,
        json: { ...ownListingDetail, id: pendingSale.listing.id, status: 'COMPLETED' },
      }),
    )

    await page.goto(SALE)
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()
    const dialog = page.getByRole('dialog', { name: '¿Confirmar la entrega?' })
    await dialog.getByRole('button', { name: 'Sí, ya lo entregué' }).click()

    await expect(dialog.getByRole('button', { name: 'Sí, ya lo entregué' })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Ahora no' })).toBeDisabled()
    release()
    await expect(page).toHaveURL(`/listings/${pendingSale.listing.id}/sale-completed`)
    await expect(page.getByRole('heading', { name: '¡Venta completada!' })).toBeVisible()
    expect(method).toBe('POST')
  })

  test('explains that the handover was already confirmed and shows the completed sale (409)', async ({ page }) => {
    await logIn(page)
    let sale: SaleFixture = pendingSale
    await page.route(API, (route) => route.fulfill({ status: 200, json: sale }))
    await page.route(HANDOVER, (route) => {
      sale = completedSale
      return route.fulfill({ status: 409, json: handoverAlreadyConfirmedError })
    })

    await page.goto(SALE)
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()
    await page.getByRole('button', { name: 'Sí, ya lo entregué' }).click()

    await expect(page.getByText('Ya habías confirmado esta entrega.')).toBeVisible()
    await expect(page.getByText('Venta completada')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toHaveCount(0)
  })

  test('explains when the handover cannot be saved and lets me try again', async ({ page }) => {
    await logIn(page)
    await mockSale(page, pendingSale)
    await page.route(HANDOVER, (route) => route.fulfill({ status: 500, json: internalError }))

    await page.goto(SALE)
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()
    await page.getByRole('button', { name: 'Sí, ya lo entregué' }).click()

    await expect(page.getByText('No pudimos confirmar la entrega. Inténtalo de nuevo.')).toBeVisible()
    await expect(page).toHaveURL(SALE)
    await expect(page.getByRole('button', { name: 'Confirmar entrega' })).toBeEnabled()
  })

  test('sends me to login when my session expired while confirming (401)', async ({ page }) => {
    await logIn(page)
    await mockSale(page, pendingSale)
    await page.route(HANDOVER, (route) => route.fulfill({ status: 401, json: unauthorizedError }))

    await page.goto(SALE)
    await page.getByRole('button', { name: 'Confirmar entrega' }).click()
    await page.getByRole('button', { name: 'Sí, ya lo entregué' }).click()

    await expect(page).toHaveURL(/\/login/)
  })
})
