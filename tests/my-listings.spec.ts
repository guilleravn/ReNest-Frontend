import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { internalError } from './fixtures/listings'
import { activeItem, completedItem, pendingItem } from './fixtures/my-listings'

test.use({ viewport: { width: 375, height: 812 } })

const BY_STATUS: Record<string, unknown[]> = {
  ACTIVE: [activeItem],
  PENDING: [pendingItem],
  COMPLETED: [completedItem],
}

async function logIn(page: Page) {
  await page.addInitScript(
    (token) => localStorage.setItem('renest.accessToken', token),
    authResponse.accessToken,
  )
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

/** Answers each tab from `data`, and records the requested statuses. */
async function mockMyListings(page: Page, data = BY_STATUS) {
  const requested: string[] = []
  await page.route('**/api/v1/me/listings?*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status') ?? ''
    requested.push(status)
    return route.fulfill({ status: 200, json: data[status] ?? [] })
  })
  return requested
}

const tabs = (page: Page) => page.getByRole('navigation', { name: 'Estado de tus artículos' })

test('has the Activos, En proceso and Completados tabs, opening on Activos (SAL-1)', async ({ page }) => {
  await logIn(page)
  const requested = await mockMyListings(page)

  await page.goto('/listings')

  await expect(page.getByRole('heading', { name: 'Mis artículos' })).toBeVisible()
  await expect(tabs(page).getByRole('link')).toHaveText(['Activos', 'En proceso', 'Completados'])
  await expect(tabs(page).getByRole('link', { name: 'Activos' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: /Lámpara de pie de latón/ })).toHaveAttribute(
    'href',
    `/listings/${activeItem.listing.id}`,
  )
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()
  await expect(page.getByText('Muebles · Poco uso')).toBeVisible()
  expect(new Set(requested)).toEqual(new Set(['ACTIVE']))
})

test('shows Pending listings with a bell marker, the buyer and the place (SAL-2)', async ({ page }) => {
  await logIn(page)
  await mockMyListings(page)

  await page.goto('/listings')
  await tabs(page).getByRole('link', { name: 'En proceso' }).click()

  await expect(page).toHaveURL('/listings?status=PENDING')
  const row = page.getByRole('link', { name: /Bicicleta urbana rodado 28/ })
  await expect(row).toHaveAttribute('href', `/sales/${pendingItem.reservation.id}`)
  await expect(row.getByText('Recogida agendada')).toBeVisible()
  await expect(row.getByText('Andrés Pérez · Café Toscano, Av. Álvaro Obregón')).toBeVisible()
  await expect(row.getByRole('img', { name: 'Requiere tu atención' })).toBeVisible()
})

test('shows Completed listings with who bought them, and no bell (SAL-5)', async ({ page }) => {
  await logIn(page)
  await mockMyListings(page)

  await page.goto('/listings?status=COMPLETED')

  const row = page.getByRole('link', { name: /Bicicleta urbana rodado 28/ })
  await expect(row).toHaveAttribute('href', `/sales/${completedItem.reservation.id}`)
  await expect(row.getByText('Completado')).toBeVisible()
  await expect(row.getByText('Vendido a Andrés Pérez')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Requiere tu atención' })).toHaveCount(0)
})

test('opens a Pending listing on its sale detail (SAL-3)', async ({ page }) => {
  await logIn(page)
  await mockMyListings(page)

  await page.goto('/listings?status=PENDING')
  await page.getByRole('link', { name: /Bicicleta urbana rodado 28/ }).click()

  await expect(page).toHaveURL(`/sales/${pendingItem.reservation.id}`)
})

for (const [status, label, title] of [
  ['ACTIVE', 'Activos', 'No tienes artículos activos'],
  ['PENDING', 'En proceso', 'Nada pendiente por ahora'],
  ['COMPLETED', 'Completados', 'Aún no tienes ventas completadas'],
]) {
  test(`shows an empty state on ${label} (SAL-1)`, async ({ page }) => {
    await logIn(page)
    await mockMyListings(page, {})

    await page.goto(`/listings?status=${status}`)

    await expect(page.getByText(title)).toBeVisible()
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(0)
  })
}

test('falls back to Activos for an unknown tab', async ({ page }) => {
  await logIn(page)
  const requested = await mockMyListings(page)

  await page.goto('/listings?status=SOLD')

  await expect(tabs(page).getByRole('link', { name: 'Activos' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('Lámpara de pie de latón')).toBeVisible()
  expect(new Set(requested)).toEqual(new Set(['ACTIVE']))
})

test('shows a loading state while a tab loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/me/listings?*', async (route) => {
    await held
    await route.fulfill({ status: 200, json: [activeItem] })
  })

  await page.goto('/listings')

  await expect(page.getByRole('status').getByText('Cargando tus artículos…')).toBeVisible()
  release()
  await expect(page.getByText('Lámpara de pie de latón')).toBeVisible()
})

test('explains when my listings cannot load and lets me retry', async ({ page }) => {
  await logIn(page)
  let failing = true
  await page.route('**/api/v1/me/listings?*', (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: [activeItem] }),
  )

  await page.goto('/listings')

  await expect(page.getByText('No pudimos cargar tus artículos')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('Lámpara de pie de latón')).toBeVisible()
})

test('sends me to login when my session expired', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/me/listings?*', (route) =>
    route.fulfill({
      status: 401,
      json: { statusCode: 401, code: 'UNAUTHORIZED', message: 'Expired', details: null },
    }),
  )

  await page.goto('/listings')

  await expect(page).toHaveURL(/\/login/)
})
