import { expect, test } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

test('offers login to an anonymous visitor', async ({ page }) => {
  await page.goto('/feed')

  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mi cuenta' })).toHaveCount(0)
})

test('shows the account menu to a logged-in user and logs out from it', async ({ page }) => {
  await logIn(page)
  await page.goto('/feed')

  await page.getByRole('button', { name: 'Mi cuenta' }).click()
  await expect(page.getByText('laura@example.com')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Mi cuenta' })).toBeVisible()

  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()
})

test('shows neither the menu nor the login button while the session loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/me', async (route) => {
    await held
    await route.fulfill({ status: 200, json: authResponse.user })
  })
  await page.goto('/feed')

  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mi cuenta' })).toHaveCount(0)
  release()
  await expect(page.getByRole('button', { name: 'Mi cuenta' })).toBeVisible()
})
