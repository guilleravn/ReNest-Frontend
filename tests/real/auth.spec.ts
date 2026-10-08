import { expect, test, type Page } from '@playwright/test'

// No mocks: these specs talk to the real backend and database. Each run uses
// its own emails, so nothing needs cleaning between runs.
test.describe.configure({ mode: 'serial' })
test.use({ viewport: { width: 375, height: 812 } })

const PASSWORD = 'password123'
const runId = Date.now().toString(36)
const emailFor = (name: string) => `${name}-${runId}@example.com`

async function register(page: Page, email: string) {
  await page.goto('/register')
  await page.getByLabel('Nombre').fill('Laura Gómez')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill('71234567')
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
}

async function logIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('registers a new account and shows it on the account page', async ({ page }) => {
  const email = emailFor('register')

  await register(page, email)
  await expect(page).toHaveURL(/\/feed$/)

  await page.goto('/account')
  await expect(page.getByText('Laura Gómez')).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await expect(page.getByText('+59171234567')).toBeVisible()
})

test('rejects registering an email that is already in use', async ({ page }) => {
  const email = emailFor('taken')
  await register(page, email)
  await expect(page).toHaveURL(/\/feed$/)
  await page.evaluate(() => localStorage.clear())

  await register(page, email)

  await expect(page.getByText('El correo ya está en uso')).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('logs out and logs in again with the same account', async ({ page }) => {
  const email = emailFor('session')
  await register(page, email)
  await expect(page).toHaveURL(/\/feed$/)

  await page.goto('/account')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await logIn(page, email, PASSWORD)
  await expect(page).not.toHaveURL(/\/login$/)

  await page.goto('/account')
  await expect(page.getByText(email)).toBeVisible()
})

test('explains wrong credentials', async ({ page }) => {
  await logIn(page, emailFor('nobody'), 'wrong-password')

  await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

// Keep last: it uses up the login attempts of this IP (limit 5 per minute).
test('blocks login after too many failed attempts', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(emailFor('brute'))
  await page.getByLabel('Contraseña').fill('wrong-password')

  const limited = page.getByText(
    'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  )
  for (let attempt = 0; attempt < 6 && !(await limited.isVisible()); attempt++) {
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(
      page.getByText('Correo o contraseña incorrectos').or(limited),
    ).toBeVisible()
  }

  await expect(limited).toBeVisible()
})
