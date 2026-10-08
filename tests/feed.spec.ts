import { expect, test, type Page, type Route } from '@playwright/test'
import { categories, feedPage, internalError, lampCard, sideboardCard } from './fixtures/feed'

test.use({ viewport: { width: 375, height: 812 } })

/** Answers GET /listings with `respond`, and GET /categories with the fixed list. */
async function mockFeed(page: Page, respond: (url: URL, route: Route) => Promise<void> | void) {
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ status: 200, json: categories }),
  )
  await page.route(/\/api\/v1\/listings(\?.*)?$/, (route) =>
    respond(new URL(route.request().url()), route),
  )
}

test('opening the app without logging in shows the feed (GEN-5)', async ({ page }) => {
  await mockFeed(page, (_, route) => route.fulfill({ json: feedPage([sideboardCard]) }))

  await page.goto('/')

  await expect(page).toHaveURL(/\/feed$/)
  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
})

test('shows the listings in the order the API returns them, newest first (BRW-1)', async ({ page }) => {
  await mockFeed(page, (_, route) => route.fulfill({ json: feedPage([sideboardCard, lampCard]) }))

  await page.goto('/feed')

  const cards = page.getByRole('main').getByRole('listitem')
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toContainText('Aparador de teca mediados de siglo')
  await expect(cards.nth(1)).toContainText('Lámpara de pie de latón')
})

test('each card shows cover, title, price, condition, category, city and the verified badge (BRW-4)', async ({ page }) => {
  await mockFeed(page, (_, route) => route.fulfill({ json: feedPage([sideboardCard, lampCard]) }))

  await page.goto('/feed')

  const sideboard = page.getByRole('link', { name: /Aparador de teca/ })
  await expect(sideboard).toHaveAttribute('href', `/items/${sideboardCard.id}`)
  await expect(sideboard.getByRole('img', { name: 'Aparador de teca mediados de siglo' })).toBeVisible()
  await expect(sideboard.getByText('$185', { exact: true })).toBeVisible()
  await expect(sideboard.getByText('Poco uso')).toBeVisible()
  await expect(sideboard.getByText('Muebles')).toBeVisible()
  await expect(sideboard.getByText('Cochabamba, BO')).toBeVisible()
  await expect(sideboard.getByText('Vendedor verificado')).toBeVisible()

  const lamp = page.getByRole('link', { name: /Lámpara de pie/ })
  await expect(lamp.getByText('$42,50', { exact: true })).toBeVisible()
  await expect(lamp.getByText('Como nuevo')).toBeVisible()
  await expect(lamp.getByText('Hogar')).toBeVisible()
  await expect(lamp.getByText('Arequipa, PE')).toBeVisible()
  await expect(lamp.getByText('Vendedor verificado')).toHaveCount(0)
})

test('shows a loading state while the listings load', async ({ page }) => {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await mockFeed(page, async (_, route) => {
    await held
    await route.fulfill({ json: feedPage([sideboardCard]) })
  })

  await page.goto('/feed')

  await expect(page.getByRole('status')).toHaveText('Cargando artículos…')
  release()
  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('shows an empty state when there are no listings', async ({ page }) => {
  await mockFeed(page, (_, route) => route.fulfill({ json: feedPage([]) }))

  await page.goto('/feed')

  await expect(page.getByText('Todavía no hay artículos')).toBeVisible()
})

test('shows an error with a retry when the listings fail to load', async ({ page }) => {
  let failing = true
  await mockFeed(page, (_, route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ json: feedPage([sideboardCard]) }),
  )

  await page.goto('/feed')
  await expect(page.getByText('No pudimos cargar los artículos')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
})
