import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { categories, feedPage, lampCard } from './fixtures/feed'
import { internalError } from './fixtures/listings'
import { activeItem, completedItem, pendingItem } from './fixtures/my-listings'

test.use({ viewport: { width: 375, height: 812 } })

async function logIn(page: Page) {
  await page.addInitScript(
    (token) => localStorage.setItem('renest.accessToken', token),
    authResponse.accessToken,
  )
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

async function mockFeed(page: Page) {
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ status: 200, json: categories }),
  )
  await page.route(/\/api\/v1\/listings(\?.*)?$/, (route) =>
    route.fulfill({ status: 200, json: feedPage([lampCard]) }),
  )
}

/** Answers each seller tab, with `pending` as the Pending listings. */
async function mockMyListings(page: Page, pending: unknown[]) {
  const data: Record<string, unknown[]> = {
    ACTIVE: [activeItem],
    PENDING: pending,
    COMPLETED: [completedItem],
  }
  await page.route('**/api/v1/me/listings?*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status') ?? ''
    return route.fulfill({ status: 200, json: data[status] ?? [] })
  })
}

// Only one of DesktopNav and BottomNav is visible at a time.
const myListingsLink = (page: Page) => page.getByRole('link', { name: /Mis artículos/ })

for (const path of ['/feed', '/listings', '/purchases', '/account']) {
  test(`marks Pending sales on the Mis artículos nav from ${path} (SAL-2)`, async ({ page }) => {
    await logIn(page)
    await mockFeed(page)
    await mockMyListings(page, [pendingItem])

    await page.goto(path)

    await expect(
      myListingsLink(page).getByRole('img', { name: '1 venta pendiente' }),
    ).toBeVisible()
  })
}

test('counts every Pending sale in the label (SAL-2)', async ({ page }) => {
  await logIn(page)
  const otherPending = { ...pendingItem, listing: { ...pendingItem.listing, id: 'other' } }
  await mockMyListings(page, [pendingItem, otherPending])

  await page.goto('/listings')

  await expect(myListingsLink(page).getByRole('img', { name: '2 ventas pendientes' })).toHaveText('2')
})

test('marks Pending sales on the desktop nav (SAL-2)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await logIn(page)
  await mockMyListings(page, [pendingItem])

  await page.goto('/listings')

  await expect(myListingsLink(page).getByRole('img', { name: '1 venta pendiente' })).toBeVisible()
})

const countAnswered = (page: Page) =>
  page.waitForResponse((response) => response.url().includes('/me/listings?status=PENDING'))

test('shows no marker without Pending sales (SAL-2)', async ({ page }) => {
  await logIn(page)
  await mockMyListings(page, [])
  const answered = countAnswered(page)

  await page.goto('/listings')

  await answered
  await expect(page.getByText('Lámpara de pie de latón')).toBeVisible()
  await expect(page.getByRole('img', { name: /pendiente/ })).toHaveCount(0)
})

test('shows no marker and keeps the page when the count cannot load', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/me/listings?*', (route) => {
    const status = new URL(route.request().url()).searchParams.get('status')
    return status === 'PENDING'
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: [activeItem] })
  })
  const answered = countAnswered(page)

  await page.goto('/listings')

  await answered
  await expect(page.getByText('Lámpara de pie de latón')).toBeVisible()
  await expect(page.getByRole('img', { name: /pendiente/ })).toHaveCount(0)
})

test('does not ask for the count when nobody is logged in', async ({ page }) => {
  await mockFeed(page)
  let asked = false
  await page.route('**/api/v1/me/listings?*', (route) => {
    asked = true
    return route.fulfill({ status: 200, json: [pendingItem] })
  })

  await page.goto('/feed')

  await expect(page.getByText(lampCard.title)).toBeVisible()
  await expect(page.getByRole('img', { name: /pendiente/ })).toHaveCount(0)
  expect(asked).toBe(false)
})
