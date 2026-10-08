import { expect, test } from '@playwright/test'
import { authResponse, invalidCredentialsError, rateLimitedError } from './fixtures/auth'

test.use({ viewport: { width: 375, height: 812 } })

test('logs in, stores the token and lands on the feed', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )
  await page.goto('/login')

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/feed$/)
  expect(
    await page.evaluate(() => localStorage.getItem('renest.accessToken')),
  ).toBe(authResponse.accessToken)
})

test('explains wrong credentials', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 401, json: invalidCredentialsError }),
  )
  await page.goto('/login')

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('wrong-password')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('gives the same message when the API rejects the input itself (AUTH-5)', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 400,
      json: {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [{ field: 'password', message: 'password must be shorter than or equal to 72 characters' }],
      },
    }),
  )
  await page.goto('/login')

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('a'.repeat(80))
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('explains that there were too many attempts', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 429, json: rateLimitedError }),
  )
  await page.goto('/login')

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(
    page.getByText('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('shows the loading state while logging in', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/auth/login', async (route) => {
    await held
    await route.fulfill({ status: 200, json: authResponse })
  })
  await page.goto('/login')

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('button', { name: 'Entrando…' })).toBeDisabled()
  release()
  await expect(page).toHaveURL(/\/feed$/)
})
