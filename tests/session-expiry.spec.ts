import { expect, test } from '@playwright/test'
import { authResponse, fakeJwt, unauthorizedError } from './fixtures/auth'

test.use({ viewport: { width: 375, height: 812 } })

test('logs out and sends to login when the API rejects the token, then returns (AUTH-6)', async ({ page }) => {
  await page.addInitScript((token) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('renest.accessToken', token)
      sessionStorage.setItem('seeded', '1')
    }
  }, fakeJwt(3600, 'rejected-by-the-server'))
  await page.route('**/api/v1/me', (route) =>
    route.request().headers().authorization === `Bearer ${authResponse.accessToken}`
      ? route.fulfill({ status: 200, json: authResponse.user })
      : route.fulfill({ status: 401, json: unauthorizedError }),
  )
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )
  await page.goto('/account')

  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText('laura@example.com')).toBeVisible()
})

test('treats an expired token as logged out before any request (AUTH-6)', async ({ page }) => {
  await page.addInitScript((token) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('renest.accessToken', token)
      sessionStorage.setItem('seeded', '1')
    }
  }, fakeJwt(-60))
  await page.goto('/listings/new')

  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()
})

test('treats an unreadable token as logged out (AUTH-6)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('renest.accessToken', 'not-a-jwt'))
  await page.goto('/listings/new')

  await expect(page).toHaveURL(/\/login$/)
})

test('logs out and sends to login when the token expires while the app is open (AUTH-6)', async ({
  page,
}) => {
  await page.clock.install()
  await page.addInitScript((token) => localStorage.setItem('renest.accessToken', token), authResponse.accessToken)
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
  await page.goto('/account')
  await expect(page.getByText('laura@example.com')).toBeVisible()

  await page.clock.fastForward('25:00:00')

  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()
})
