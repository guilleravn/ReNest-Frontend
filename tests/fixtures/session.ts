import type { Page } from '@playwright/test'
import { authResponse } from './auth'

/**
 * Answers what every logged-in page asks for: the user (`/me`) and the nav's
 * counts (`/me/listings`, `/me/purchases`), empty. A spec that needs other
 * data routes them again after this; the later route wins.
 */
export async function mockSession(page: Page) {
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
  await page.route('**/api/v1/me/listings?*', (route) => route.fulfill({ status: 200, json: [] }))
  await page.route('**/api/v1/me/purchases?*', (route) => route.fulfill({ status: 200, json: [] }))
}

/**
 * Starts the test logged in with `token`, and mocks the session. The token is
 * seeded once per tab, so a logout survives later navigations.
 */
export async function logIn(page: Page, { token = authResponse.accessToken } = {}) {
  await page.addInitScript((token) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('renest.accessToken', token)
      sessionStorage.setItem('seeded', '1')
    }
  }, token)
  await mockSession(page)
}
