import { expect, test, type Page } from './fixtures/test'
import { authResponse } from './fixtures/auth'
import { categories, mockEmptyFeed } from './fixtures/feed'
import { listingNotFoundError } from './fixtures/listings'
import { logIn, mockSession } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

/** The publish form loads the categories. */
async function mockCategories(page: Page) {
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ status: 200, json: categories }),
  )
}

/** The item pages below only check access; listing 42 doesn't need to exist. */
async function mockMissingListing(page: Page) {
  await page.route('**/api/v1/listings/42', (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )
}

test('sends a logged-out user from publishing to login and back afterwards', async ({ page }) => {
  await mockSession(page)
  await mockCategories(page)
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

test('returns to the reservation after signing up from the login screen', async ({ page }) => {
  await mockSession(page)
  await mockMissingListing(page)
  await page.route('**/api/v1/auth/register', (route) =>
    route.fulfill({ status: 201, json: authResponse }),
  )
  await page.goto('/items/42/pickup')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole('link', { name: 'Regístrate' }).click()
  await page.getByLabel('Nombre').fill('Laura Gómez')
  await page.getByLabel('Correo').fill('laura@example.com')
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill('71234567')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(page).toHaveURL(/\/items\/42\/pickup$/)
})

for (const path of ['/purchases/7/checklist', '/purchases/7/rate', '/listings/7']) {
  test(`requires login for ${path}`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveURL(/\/login$/)
  })
}

test('lets a logged-in user straight into a protected action', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  await page.goto('/listings/new')

  await expect(page).toHaveURL(/\/listings\/new$/)
})

for (const path of ['/feed', '/items/42']) {
  test(`keeps ${path} public`, async ({ page }) => {
    await mockEmptyFeed(page)
    await mockMissingListing(page)
    await page.goto(path)

    await expect(page).toHaveURL(path)
  })
}
