import { expect, test, type Page } from '@playwright/test'
import { authResponse, emailTakenError, validationError } from './fixtures/auth'

test.use({ viewport: { width: 375, height: 812 } })

async function fillForm(page: Page, { phone = '+525512345678' } = {}) {
  await page.getByLabel('Nombre').fill('Laura Gómez')
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill(phone)
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
}

test('registers, stores the token and lands on the feed', async ({ page }) => {
  let body: unknown
  await page.route('**/api/v1/auth/register', (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ status: 201, json: authResponse })
  })
  await page.goto('/register')
  await fillForm(page)

  await expect(page).toHaveURL(/\/feed$/)
  expect(body).toEqual({
    fullName: 'Laura Gómez',
    email: 'laura@example.com',
    phoneE164: '+525512345678',
    password: 'password123',
    city: 'COCHABAMBA_BO',
  })
  expect(
    await page.evaluate(() => localStorage.getItem('renest.accessToken')),
  ).toBe(authResponse.accessToken)
})

test('shows the loading state while the account is created', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/api/v1/auth/register', async (route) => {
    await held
    await route.fulfill({ status: 201, json: authResponse })
  })
  await page.goto('/register')
  await fillForm(page)

  await expect(page.getByRole('button', { name: 'Creando cuenta…' })).toBeDisabled()
  release()
  await expect(page).toHaveURL(/\/feed$/)
})

test('explains an email already in use', async ({ page }) => {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({ status: 409, json: emailTakenError }),
  )
  await page.goto('/register')
  await fillForm(page)

  await expect(page.getByText('El correo ya está en uso')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('shows each rejected field under its input', async ({ page }) => {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({ status: 400, json: validationError }),
  )
  await page.goto('/register')
  await fillForm(page)

  await expect(
    page.getByText('Usa el formato internacional, por ejemplo +59171234567'),
  ).toBeVisible()
  await expect(
    page.getByText('La contraseña debe tener entre 8 y 72 caracteres'),
  ).toBeVisible()
  await expect(page.getByLabel('Teléfono')).toHaveAttribute('aria-invalid', 'true')
  await expect(page).toHaveURL(/\/register$/)
})

test('does not send a phone outside the international format', async ({ page }) => {
  let requests = 0
  await page.route('**/api/v1/auth/register', (route) => {
    requests++
    return route.fulfill({ status: 201, json: authResponse })
  })
  await page.goto('/register')
  await fillForm(page, { phone: '5512345678' })

  await expect(page).toHaveURL(/\/register$/)
  expect(
    await page.getByLabel('Teléfono').evaluate((el: HTMLInputElement) => el.validity.valid),
  ).toBe(false)
  expect(requests).toBe(0)
})
