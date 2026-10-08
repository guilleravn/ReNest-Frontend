import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { internalError } from './fixtures/listings'
import { purchaseCompleted, purchaseInProgress } from './fixtures/purchases'

test.use({ viewport: { width: 375, height: 812 } })

async function logIn(page: Page) {
  await page.addInitScript((token) => localStorage.setItem('renest.accessToken', token), authResponse.accessToken)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockPurchases(page: Page, inProgress: object[], completed: object[]) {
  await page.route('**/api/v1/me/purchases?*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status')
    return route.fulfill({ status: 200, json: status === 'COMPLETED' ? completed : inProgress })
  })
}

test('lists scheduled purchases under "Agendados" with the pickup pair (PUR-1)', async ({ page }) => {
  await logIn(page)
  await mockPurchases(page, [purchaseInProgress], [purchaseCompleted])

  await page.goto('/purchases')

  const row = page.getByRole('link', { name: /Aparador de teca mediados de siglo/ })
  await expect(row).toBeVisible()
  await expect(row).toContainText('Recogida agendada')
  await expect(row).toContainText('$185')
  await expect(row).toContainText('Café Toscano, Av. Álvaro Obregón · los sábados · 10:00–13:00')
  await expect(page.getByText('Sillón de cuero')).toHaveCount(0)
})

test('lists purchases whose reception was confirmed under "Completados" (PUR-1, PUR-2)', async ({ page }) => {
  await logIn(page)
  await mockPurchases(page, [purchaseInProgress], [purchaseCompleted])
  await page.goto('/purchases')

  await page.getByRole('button', { name: 'Completados' }).click()

  await expect(page).toHaveURL(/\/purchases\?tab=completed$/)
  const row = page.getByRole('link', { name: /Sillón de cuero/ })
  await expect(row).toContainText('Completado')
  await expect(page.getByText('Aparador de teca mediados de siglo')).toHaveCount(0)
})

test('keeps a purchase under "Agendados" when only the seller confirmed the handover (PUR-2)', async ({ page }) => {
  await logIn(page)
  await mockPurchases(
    page,
    [{ ...purchaseInProgress, sellerHandedOverAt: '2026-10-09T12:00:00.000Z' }],
    [],
  )

  await page.goto('/purchases')

  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toContainText(
    'El vendedor confirmó la entrega',
  )
})

test('opens the purchase recap when tapping a purchase (PUR-3)', async ({ page }) => {
  await logIn(page)
  await mockPurchases(page, [purchaseInProgress], [])
  await page.goto('/purchases')

  await page.getByRole('link', { name: /Aparador de teca/ }).click()

  await expect(page).toHaveURL(`/purchases/${purchaseInProgress.id}`)
})

test('shows an empty state on each tab', async ({ page }) => {
  await logIn(page)
  await mockPurchases(page, [], [])

  await page.goto('/purchases')
  await expect(page.getByText('No tienes recogidas agendadas')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver artículos' })).toBeVisible()

  await page.getByRole('button', { name: 'Completados' }).click()
  await expect(page.getByText('Aún no tienes compras completadas')).toBeVisible()
})

test('shows a loading state while the purchases load', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/me/purchases?*', async (route) => {
    await held
    await route.fulfill({ status: 200, json: [purchaseInProgress] })
  })

  await page.goto('/purchases')

  await expect(page.getByRole('status')).toHaveText('Cargando compras…')
  release()
  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
})

test('explains a failed load and retries (error state)', async ({ page }) => {
  await logIn(page)
  let fail = true
  await page.route('**/api/v1/me/purchases?*', (route) =>
    fail
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: [purchaseInProgress] }),
  )
  await page.goto('/purchases')
  await expect(page.getByText('No pudimos cargar tus compras')).toBeVisible()

  fail = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
})

test('sends an anonymous visitor to login (401)', async ({ page }) => {
  await page.goto('/purchases')

  await expect(page).toHaveURL(/\/login/)
})
