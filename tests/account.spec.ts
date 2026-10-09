import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { categories, feedPage, lampCard } from './fixtures/feed'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

async function mockFeed(page: Page) {
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ status: 200, json: categories }),
  )
  await page.route(/\/api\/v1\/listings(\?.*)?$/, (route) =>
    route.fulfill({ status: 200, json: feedPage([lampCard]) }),
  )
}

const appNav = (page: Page) => page.getByRole('navigation').filter({ has: page.getByRole('link', { name: 'Inicio' }) })

test('shows my name, email, phone and city read-only, opened from the avatar menu (AUTH-8)', async ({ page }) => {
  await logIn(page)
  await mockFeed(page)
  let authorization: string | undefined
  await page.route('**/api/v1/me', (route) => {
    authorization = route.request().headers().authorization
    return route.fulfill({ status: 200, json: authResponse.user })
  })
  await page.goto('/feed')

  await page.getByRole('button', { name: 'Mi cuenta' }).click()
  await page.getByRole('menuitem', { name: 'Mi cuenta' }).click()

  await expect(page).toHaveURL(/\/account$/)

  const profile = page.getByRole('region', { name: 'Tus datos' })
  await expect(profile.getByText('Laura Gómez')).toBeVisible()
  await expect(profile.getByText('laura@example.com')).toBeVisible()
  await expect(profile.getByText('+525512345678')).toBeVisible()
  await expect(profile.getByText('Cochabamba, BO')).toBeVisible()
  await expect(profile.getByRole('textbox')).toHaveCount(0)
  expect(authorization).toBe(`Bearer ${authResponse.accessToken}`)
})

for (const [device, viewport] of [
  ['mobile', { width: 375, height: 812 }],
  ['desktop', { width: 1280, height: 800 }],
] as const) {
  test(`shows only Inicio and Mis artículos in the nav, none active, on ${device} (AUTH-8)`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await logIn(page)
    await mockFeed(page)
    await page.route('**/api/v1/me', (route) =>
      route.fulfill({ status: 200, json: authResponse.user }),
    )
    await page.goto('/account')

    const nav = appNav(page).locator('visible=true')
    await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Mis artículos'])
    await expect(page.getByRole('link', { name: 'Cuenta' })).toHaveCount(0)
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(0)

    await nav.getByRole('link', { name: 'Inicio' }).click()
    await expect(page).toHaveURL(/\/feed$/)
  })
}

test('shows a loading state while my account loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/me', async (route) => {
    await held
    await route.fulfill({ status: 200, json: authResponse.user })
  })
  await page.goto('/account')

  await expect(page.getByText('Cargando sesión…')).toBeVisible()
  release()
  await expect(page.getByText('laura@example.com')).toBeVisible()
})

test('explains when my account cannot load and lets me retry', async ({ page }) => {
  await logIn(page)
  let failing = true
  await page.route('**/api/v1/me', (route) =>
    failing
      ? route.fulfill({
          status: 500,
          json: { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
        })
      : route.fulfill({ status: 200, json: authResponse.user }),
  )
  await page.goto('/account')

  await expect(page.getByText('No pudimos cargar tu sesión')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('laura@example.com')).toBeVisible()
})

test('logs out, discards the token and goes to login (AUTH-6)', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
  await page.goto('/account')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()

  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)
})
