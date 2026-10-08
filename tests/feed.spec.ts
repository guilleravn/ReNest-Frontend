import { expect, test, type Page, type Route } from '@playwright/test'
import {
  cards,
  categories,
  feedPage,
  internalError,
  lampCard,
  sideboardCard,
} from './fixtures/feed'

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

test('"Cargar más" appends the next page of 20 and disappears on the last page (BRW-10)', async ({ page }) => {
  const cursors: (string | null)[] = []
  await mockFeed(page, (url, route) => {
    const cursor = url.searchParams.get('cursor')
    cursors.push(cursor)
    return route.fulfill({
      json: cursor === 'page-2' ? feedPage(cards(3, 21)) : feedPage(cards(20), 'page-2'),
    })
  })

  await page.goto('/feed')
  const cards_ = page.getByRole('main').getByRole('listitem')
  await expect(cards_).toHaveCount(20)
  await page.getByRole('button', { name: 'Cargar más' }).click()

  await expect(cards_).toHaveCount(23)
  await expect(cards_.nth(0)).toContainText('Artículo 1')
  await expect(cards_.nth(22)).toContainText('Artículo 23')
  await expect(page.getByRole('button', { name: 'Cargar más' })).toHaveCount(0)
  expect(cursors.at(-1)).toBe('page-2')
})

test('hides "Cargar más" when everything fits in one page (BRW-10)', async ({ page }) => {
  await mockFeed(page, (_, route) => route.fulfill({ json: feedPage([sideboardCard]) }))

  await page.goto('/feed')

  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cargar más' })).toHaveCount(0)
})

test('keeps the loaded listings and lets me retry when "Cargar más" fails (BRW-10)', async ({ page }) => {
  let failing = true
  await mockFeed(page, (url, route) => {
    if (!url.searchParams.has('cursor')) {
      return route.fulfill({ json: feedPage(cards(20), 'page-2') })
    }
    return failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ json: feedPage(cards(1, 21)) })
  })

  await page.goto('/feed')
  await page.getByRole('button', { name: 'Cargar más' }).click()
  const cards_ = page.getByRole('main').getByRole('listitem')

  await expect(page.getByRole('alert')).toHaveText('No pudimos cargar más artículos. Inténtalo de nuevo.')
  await expect(cards_).toHaveCount(20)
  failing = false
  await page.getByRole('button', { name: 'Cargar más' }).click()
  await expect(cards_).toHaveCount(21)
  await expect(page.getByRole('alert')).toHaveCount(0)
})
