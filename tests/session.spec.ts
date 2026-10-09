import { expect, test } from '@playwright/test'
import { authResponse, fakeJwt, unauthorizedError } from './fixtures/auth'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const TOKEN_KEY = 'renest.accessToken'

/** Seeds the token on the first load only, so a discarded token stays discarded after a reload. */
test('stays anonymous without asking the API when there is no token', async ({ page }) => {
  let meRequests = 0
  await page.route('**/api/v1/me', (route) => {
    meRequests += 1
    return route.fulfill({ status: 200, json: authResponse.user })
  })

  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  expect(meRequests).toBe(0)
})

test('loads the session with the stored token', async ({ page }) => {
  await logIn(page)
  const authorization = page.waitForRequest((request) => request.url().endsWith('/api/v1/me'))
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )

  await page.goto('/feed')

  const request = await authorization
  expect(request.headers().authorization).toBe(`Bearer ${authResponse.accessToken}`)
})

test('discards a token the API rejects with 401', async ({ page }) => {
  await logIn(page, { token: fakeJwt(3600, 'rejected-by-the-server') })
  const answered = page.waitForResponse((response) => response.url().endsWith('/api/v1/me'))
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 401, json: unauthorizedError }),
  )

  await page.goto('/feed')

  expect((await answered).status()).toBe(401)
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY).catch(() => 'navigating'),
    )
    .toBeNull()
})

test('keeps the token when loading the session fails for another reason', async ({ page }) => {
  await logIn(page)
  const answered = page.waitForResponse((response) => response.url().endsWith('/api/v1/me'))
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 500,
      json: { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
    }),
  )

  await page.goto('/feed')

  expect((await answered).status()).toBe(500)
  expect(await page.evaluate((key) => localStorage.getItem(key), TOKEN_KEY)).toBe(
    authResponse.accessToken,
  )
})
