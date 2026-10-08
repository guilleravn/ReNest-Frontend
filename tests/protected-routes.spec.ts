import { expect, test } from '@playwright/test'
import { authResponse } from './fixtures/auth'

test.use({ viewport: { width: 375, height: 812 } })

test('sends a logged-out user from publishing to login and back afterwards', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )
  await page.goto('/listings/new')

  await expect(page).toHaveURL(/\/login\?next=%2Flistings%2Fnew$/)
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/listings\/new$/)
})

test('returns to the reservation after signing up from the login screen', async ({ page }) => {
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({ status: 201, json: authResponse }),
  )
  await page.goto('/items/42/pickup')
  await expect(page).toHaveURL(/\/login\?next=/)

  await page.getByRole('link', { name: 'Regístrate' }).click()
  await page.getByLabel('Nombre').fill('Laura Gómez')
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill('+525512345678')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL(/\/items\/42\/pickup$/)
})

for (const path of ['/purchases/7/checklist', '/purchases/7/rate', '/listings/7']) {
  test(`requires login for ${path}`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`)
  })
}

test('lets a logged-in user straight into a protected action', async ({ page }) => {
  await page.addInitScript((token) => localStorage.setItem('renest.accessToken', token), authResponse.accessToken)
  await page.goto('/listings/new')

  await expect(page).toHaveURL(/\/listings\/new$/)
})

for (const path of ['/feed', '/items/42']) {
  test(`keeps ${path} public`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveURL(path)
  })
}

test('ignores a return address outside the app', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, json: authResponse }),
  )
  await page.goto('/login?next=//evil.example.com')

  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/localhost:5173\/feed$/)
})
