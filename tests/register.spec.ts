import { expect, test, type Page } from './fixtures/test'
import { authResponse, emailTakenError, rateLimitedError, validationError } from './fixtures/auth'
import { mockSession } from './fixtures/session'
import { mockEmptyFeed } from './fixtures/feed'

test.use({ viewport: { width: 375, height: 812 } })

async function fillForm(page: Page, { phone = '71234567' } = {}) {
  await page.getByLabel('Nombre').fill('Laura Gómez')
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill(phone)
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
}

test('registers, stores the token and lands on the feed', async ({ page }) => {
  await mockSession(page)
  await mockEmptyFeed(page)
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
    phoneE164: '+59171234567',
    password: 'password123',
    city: 'COCHABAMBA_BO',
  })
  expect(
    await page.evaluate(() => localStorage.getItem('renest.accessToken')),
  ).toBe(authResponse.accessToken)
})

test('shows the loading state while the account is created', async ({ page }) => {
  await mockSession(page)
  await mockEmptyFeed(page)
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

  await expect(page.getByText('El teléfono no es válido para el país elegido')).toBeVisible()
  await expect(
    page.getByText('La contraseña debe tener entre 8 y 72 caracteres'),
  ).toBeVisible()
  await expect(page.getByLabel('Teléfono')).toHaveAttribute('aria-invalid', 'true')
  await expect(page).toHaveURL(/\/register$/)
})

test('prefixes the phone with the calling code of the chosen zone', async ({ page }) => {
  await mockSession(page)
  await mockEmptyFeed(page)
  let body: { phoneE164?: string } = {}
  await page.route('**/api/v1/auth/register', (route) => {
    body = route.request().postDataJSON()
    return route.fulfill({ status: 201, json: authResponse })
  })
  await page.goto('/register')

  await expect(page.getByLabel('Teléfono')).toBeDisabled()
  await page.getByLabel('Tu zona').selectOption({ label: 'Arequipa, PE' })
  await expect(page.getByText('+51', { exact: true })).toBeVisible()
  await page.getByLabel('Teléfono').fill('912345678')
  await expect(page.getByLabel('Teléfono')).toHaveValue('912 345 678')

  await page.getByLabel('Nombre').fill('Laura Gómez')
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL(/\/feed$/)
  expect(body.phoneE164).toBe('+51912345678')
})

test('keeps only digits and caps the phone to the country length', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill('7a1b2-3 4567 89')

  await expect(page.getByLabel('Teléfono')).toHaveValue('7123 4567')
})

test('does not send a phone that is too short and says why', async ({ page }) => {
  let requests = 0
  await page.route('**/api/v1/auth/register', (route) => {
    requests++
    return route.fulfill({ status: 201, json: authResponse })
  })
  await page.goto('/register')
  await fillForm(page, { phone: '7123' })

  await expect(page.getByText('El teléfono debe tener 8 dígitos')).toBeVisible()
  await expect(page.getByLabel('Teléfono')).toHaveAttribute('aria-invalid', 'true')
  await expect(page).toHaveURL(/\/register$/)
  expect(requests).toBe(0)
})

test('rejects a phone that does not start with a mobile digit', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill('21234567')
  await page.getByLabel('Teléfono').blur()

  await expect(page.getByText('Ingresa un número de celular válido')).toBeVisible()
})

test('explains that there were too many attempts', async ({ page }) => {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({ status: 429, json: rateLimitedError }),
  )
  await page.goto('/register')
  await fillForm(page)

  await expect(
    page.getByText('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})
