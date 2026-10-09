import { expect, test } from '@playwright/test'
import { authResponse, fakeJwt, unauthorizedError } from './fixtures/auth'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const TOKEN_KEY = 'renest.accessToken'

test('sends an anonymous user to login and back after logging in', async ({
  page,
}) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )

  await page.goto('/listings/new')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/listings\/new$/)
})

test('keeps the return path when switching from login to register', async ({
  page,
}) => {
  await page.goto('/purchases')
  await page.getByRole('link', { name: 'Regístrate' }).click()
  await expect(page).toHaveURL(/\/register$/)

  await page.getByRole('link', { name: 'Inicia sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/purchases$/)
})

test('lets a logged-in user into a protected route', async ({ page }) => {
  await logIn(page)

  await page.goto('/purchases')

  await expect(page).toHaveURL(/\/purchases$/)
})

test('sends a user with an expired token to login', async ({ page }) => {
  await logIn(page, { token: fakeJwt(3600, 'rejected-by-the-server') })
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 401, json: unauthorizedError }),
  )

  await page.goto('/purchases')

  await expect(page).toHaveURL(/\/login$/)
})

test('redirects a logged-in user away from login and register', async ({
  page,
}) => {
  await logIn(page)

  await page.goto('/login')
  await expect(page).toHaveURL(/\/feed$/)

  await page.goto('/register')
  await expect(page).toHaveURL(/\/feed$/)
})

test('treats an expired token as logged out before any request (AUTH-6)', async ({ page }) => {
  await logIn(page, { token: fakeJwt(-60) })
  let meRequests = 0
  await page.route('**/api/v1/me', (route) => {
    meRequests += 1
    return route.fulfill({ status: 200, json: authResponse.user })
  })

  await page.goto('/purchases')

  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY)).toBeNull()
  expect(meRequests).toBe(0)
})

test('ignores a return address outside the app', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )
  await page.goto('/login')
  await page.evaluate(() =>
    history.replaceState({ usr: { from: '//evil.example.com' }, key: 'evil', idx: 0 }, ''),
  )
  await page.reload()

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/feed$/)
})

test('keeps the user logged in and offers a retry when the session cannot load', async ({
  page,
}) => {
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

  await page.goto('/purchases')

  await expect(page.getByText('No pudimos cargar tu sesión')).toBeVisible()
  await expect(page).toHaveURL(/\/purchases$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY)).toBe(
    authResponse.accessToken,
  )

  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('No pudimos cargar tu sesión')).toBeHidden()
  await expect(page).toHaveURL(/\/purchases$/)
})

test('shows a loading state while the session loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/me', async (route) => {
    await held
    await route.fulfill({ status: 200, json: authResponse.user })
  })

  await page.goto('/purchases')

  await expect(page.getByText('Cargando sesión…')).toBeVisible()
  release()
  await expect(page.getByText('Cargando sesión…')).toBeHidden()
  await expect(page).toHaveURL(/\/purchases$/)
})
