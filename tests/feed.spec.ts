import { expect, test, type Page, type Route } from './fixtures/test'
import { authResponse } from './fixtures/auth'
import {
  cards,
  categories,
  feedPage,
  internalError,
  lampCard,
  sideboardCard,
} from './fixtures/feed'
import { logIn } from './fixtures/session'
import { expectTapTarget } from './fixtures/tap-target'

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

/** Records the query of every GET /listings and answers with `cards` or an empty page. */
async function mockSearch(page: Page, matches: (url: URL) => object[]) {
  const requests: URL[] = []
  await mockFeed(page, (url, route) => {
    requests.push(url)
    return route.fulfill({ json: feedPage(matches(url), null) })
  })
  return requests
}

test('searches the title from 2 characters on, and not before (BRW-2)', async ({ page }) => {
  const requests = await mockSearch(page, (url) =>
    url.searchParams.get('q') === 'si' ? [sideboardCard] : [sideboardCard, lampCard],
  )
  await page.goto('/feed')
  const search = page.getByRole('searchbox', { name: 'Buscar por título' })
  const cards_ = page.getByRole('main').getByRole('listitem')
  await expect(cards_).toHaveCount(2)

  await search.fill(' s ')
  // Picking a category makes a request: it must not carry the 1-character search.
  await page.getByRole('button', { name: 'Muebles' }).click()
  await expect.poll(() => requests.at(-1)?.searchParams.get('category')).toBe('muebles')
  expect(requests.every((url) => !url.searchParams.has('q'))).toBe(true)

  await search.fill('si')
  await expect(cards_).toHaveCount(1)
  expect(requests.at(-1)?.searchParams.get('q')).toBe('si')
  await expect(page).toHaveURL(/[?&]q=si(&|$)/)
})

test('the category filter combines with the search (BRW-3)', async ({ page }) => {
  const requests = await mockSearch(page, () => [lampCard])
  await page.goto('/feed')

  await page.getByRole('searchbox', { name: 'Buscar por título' }).fill('lámpara')
  await expect.poll(() => requests.at(-1)?.searchParams.get('q')).toBe('lámpara')
  await page.getByRole('group', { name: 'Categorías' }).getByRole('button', { name: 'Hogar' }).click()

  await expect.poll(() => requests.at(-1)?.search).toBe(
    `?${new URLSearchParams({ q: 'lámpara', category: 'hogar' })}`,
  )
  await expect(page.getByRole('button', { name: 'Hogar' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
})

test('shows the categories from the API, with "Todas" selected by default (BRW-3)', async ({ page }) => {
  await mockSearch(page, () => [sideboardCard])

  await page.goto('/feed')

  const chips = page.getByRole('group', { name: 'Categorías' }).getByRole('button')
  await expect(chips).toHaveText(['Todas', 'Electrónica', 'Hogar', 'Muebles'])
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true')
})

test('with no results, "Limpiar filtros" clears the search and the category', async ({ page }) => {
  const requests = await mockSearch(page, (url) =>
    url.searchParams.has('q') || url.searchParams.has('category') ? [] : [sideboardCard],
  )
  await page.goto('/feed?q=bicicleta&category=hogar')
  const search = page.getByRole('searchbox', { name: 'Buscar por título' })

  await expect(page.getByText('No encontramos artículos')).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()

  await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
  await expect(search).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/\/feed$/)
  expect(requests.at(-1)?.search).toBe('')
})

test('the clear button in the search box removes the search (BRW-2)', async ({ page }) => {
  const requests = await mockSearch(page, () => [sideboardCard])
  await page.goto('/feed?q=teca')
  const search = page.getByRole('searchbox', { name: 'Buscar por título' })
  await expect(search).toHaveValue('teca')
  await expectTapTarget(page.getByRole('button', { name: 'Borrar búsqueda' }))

  await page.getByRole('button', { name: 'Borrar búsqueda' }).click()

  await expect(search).toHaveValue('')
  await expect.poll(() => requests.at(-1)?.searchParams.has('q')).toBe(false)
})

test('"Cargar más" keeps the current search and category (BRW-10)', async ({ page }) => {
  const requests: URL[] = []
  await mockFeed(page, (url, route) => {
    requests.push(url)
    return route.fulfill({
      json: url.searchParams.has('cursor')
        ? feedPage(cards(1, 21))
        : feedPage(cards(20), 'page-2'),
    })
  })
  await page.goto('/feed?q=silla&category=hogar')

  await page.getByRole('button', { name: 'Cargar más' }).click()

  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(21)
  expect(Object.fromEntries(requests.at(-1)!.searchParams)).toEqual({
    q: 'silla',
    category: 'hogar',
    cursor: 'page-2',
  })
})

test('"Inicio" resets the search box and the category', async ({ page }) => {
  await page.clock.install()
  const requests = await mockSearch(page, () => [sideboardCard])
  await page.goto('/feed?q=teca&category=hogar')
  const search = page.getByRole('searchbox', { name: 'Buscar por título' })
  await expect(search).toHaveValue('teca')

  await page.getByRole('link', { name: 'Inicio', exact: true }).filter({ visible: true }).click()

  await expect(page).toHaveURL(/\/feed$/)
  await expect(search).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => requests.at(-1)?.search).toBe('')
  // The old search must not come back once the debounce would have fired.
  await page.clock.runFor(1000)
  await expect(page).toHaveURL(/\/feed$/)
  expect(requests.at(-1)?.search).toBe('')
})

// `logIn` is Laura, from Cochabamba (`authResponse.user.city`).
const citySelect = (page: Page) => page.getByRole('combobox', { name: 'Ubicación' })

test.describe('city filter (BRW-11)', () => {
  test('a logged-in user starts on their own city (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, () => [sideboardCard])

    await page.goto('/feed')

    await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
    await expect(citySelect(page)).toHaveValue('COCHABAMBA_BO')
    // The feed waits for the user, so no request goes out without the city.
    expect(requests.map((url) => url.searchParams.get('city'))).toEqual(['COCHABAMBA_BO'])
    await expect(page).toHaveURL(/\/feed$/)
  })

  test('an anonymous visitor sees every city (BRW-11)', async ({ page }) => {
    const requests = await mockSearch(page, () => [sideboardCard, lampCard])

    await page.goto('/feed')

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(2)
    await expect(citySelect(page)).toHaveValue('all')
    expect(requests.every((url) => !url.searchParams.has('city'))).toBe(true)
  })

  test('offers "Todas las ubicaciones" and every city by its Spanish name (BRW-11)', async ({ page }) => {
    await mockSearch(page, () => [sideboardCard])

    await page.goto('/feed')

    await expect(citySelect(page).getByRole('option')).toHaveText([
      'Todas las ubicaciones',
      'Cochabamba, BO',
      'Arequipa, PE',
      'San Salvador, SV',
      'Utah, US',
    ])
  })

  test('picking another city filters by it and keeps it in the URL (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, (url) =>
      url.searchParams.get('city') === 'AREQUIPA_PE' ? [lampCard] : [sideboardCard],
    )
    await page.goto('/feed')
    await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()

    await citySelect(page).selectOption({ label: 'Arequipa, PE' })

    await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Aparador de teca/ })).toHaveCount(0)
    await expect(page).toHaveURL(/[?&]city=AREQUIPA_PE(&|$)/)
    expect(requests.at(-1)?.searchParams.get('city')).toBe('AREQUIPA_PE')
  })

  test('"Todas las ubicaciones" removes the filter, also after a reload (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, (url) =>
      url.searchParams.has('city') ? [sideboardCard] : [sideboardCard, lampCard],
    )
    await page.goto('/feed')
    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1)

    await citySelect(page).selectOption({ label: 'Todas las ubicaciones' })

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(2)
    await expect(page).toHaveURL(/[?&]city=all(&|$)/)
    expect(requests.at(-1)?.searchParams.has('city')).toBe(false)

    await page.reload()

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(2)
    await expect(citySelect(page)).toHaveValue('all')
    expect(requests.at(-1)?.searchParams.has('city')).toBe(false)
  })

  test('a city in the URL wins over the user\'s own city after a reload (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, () => [lampCard])

    await page.goto('/feed?city=UTAH_US')
    await page.reload()

    await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
    await expect(citySelect(page)).toHaveValue('UTAH_US')
    expect(requests.every((url) => url.searchParams.get('city') === 'UTAH_US')).toBe(true)
  })

  test('an unknown city in the URL falls back to the default (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, () => [sideboardCard])

    await page.goto('/feed?city=LA_PAZ_BO')

    await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
    await expect(citySelect(page)).toHaveValue('COCHABAMBA_BO')
    expect(requests.at(-1)?.searchParams.get('city')).toBe('COCHABAMBA_BO')
  })

  test('the city combines with the search and the category (BRW-2, BRW-3, BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, () => [lampCard])
    await page.goto('/feed?city=AREQUIPA_PE')

    await page.getByRole('searchbox', { name: 'Buscar por título' }).fill('lámpara')
    await expect.poll(() => requests.at(-1)?.searchParams.get('q')).toBe('lámpara')
    await page.getByRole('group', { name: 'Categorías' }).getByRole('button', { name: 'Hogar' }).click()

    await expect.poll(() => requests.at(-1)?.searchParams.get('category')).toBe('hogar')
    expect(Object.fromEntries(requests.at(-1)!.searchParams)).toEqual({
      q: 'lámpara',
      category: 'hogar',
      city: 'AREQUIPA_PE',
    })
    await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
  })

  test('"Cargar más" keeps the city (BRW-10, BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests: URL[] = []
    await mockFeed(page, (url, route) => {
      requests.push(url)
      return route.fulfill({
        json: url.searchParams.has('cursor') ? feedPage(cards(1, 21)) : feedPage(cards(20), 'page-2'),
      })
    })
    await page.goto('/feed')

    await page.getByRole('button', { name: 'Cargar más' }).click()

    await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(21)
    expect(Object.fromEntries(requests.at(-1)!.searchParams)).toEqual({
      city: 'COCHABAMBA_BO',
      cursor: 'page-2',
    })
  })

  test('"Limpiar filtros" clears the search and the category but keeps the city (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, (url) =>
      url.searchParams.has('q') ? [] : [lampCard],
    )
    await page.goto('/feed?q=bicicleta&category=hogar&city=AREQUIPA_PE')

    await page.getByRole('button', { name: 'Limpiar filtros' }).click()

    await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
    await expect(citySelect(page)).toHaveValue('AREQUIPA_PE')
    expect(Object.fromEntries(requests.at(-1)!.searchParams)).toEqual({ city: 'AREQUIPA_PE' })
  })

  test('when the session fails to load, shows an error instead of every city, and retrying loads the own city (BRW-11)', async ({ page }) => {
    let meFails = true
    await logIn(page)
    await page.route('**/api/v1/me', (route) =>
      meFails
        ? route.fulfill({ status: 500, json: internalError })
        : route.fulfill({ json: authResponse.user }),
    )
    const requests = await mockSearch(page, () => [sideboardCard])
    await page.goto('/feed')

    await expect(page.getByText('No pudimos cargar los artículos')).toBeVisible()
    expect(requests).toHaveLength(0)
    meFails = false
    await page.getByRole('button', { name: 'Reintentar' }).click()

    await expect(page.getByRole('link', { name: /Aparador de teca/ })).toBeVisible()
    await expect(citySelect(page)).toHaveValue('COCHABAMBA_BO')
    expect(requests.map((url) => url.searchParams.get('city'))).toEqual(['COCHABAMBA_BO'])
  })

  test('when the session fails to load, a city in the URL still loads (BRW-11)', async ({ page }) => {
    await logIn(page)
    await page.route('**/api/v1/me', (route) => route.fulfill({ status: 500, json: internalError }))
    const requests = await mockSearch(page, () => [lampCard])

    await page.goto('/feed?city=all')

    await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
    expect(requests.every((url) => !url.searchParams.has('city'))).toBe(true)
  })
})

test.describe('empty feed in a city (BRW-11)', () => {
  test('names the city and offers to see every city (BRW-11)', async ({ page }) => {
    await logIn(page)
    const requests = await mockSearch(page, (url) =>
      url.searchParams.has('city') ? [] : [lampCard],
    )
    await page.goto('/feed')

    await expect(page.getByText('No hay artículos en Cochabamba, BO')).toBeVisible()
    await page.getByRole('button', { name: 'Ver todas las ubicaciones' }).click()

    await expect(page.getByRole('link', { name: /Lámpara de pie/ })).toBeVisible()
    await expect(citySelect(page)).toHaveValue('all')
    await expect(page).toHaveURL(/[?&]city=all(&|$)/)
    expect(requests.at(-1)?.searchParams.has('city')).toBe(false)
  })

  test('with a search or category, keeps "No encontramos artículos" (BRW-11)', async ({ page }) => {
    await logIn(page)
    await mockSearch(page, () => [])

    await page.goto('/feed?category=hogar')

    await expect(page.getByText('No encontramos artículos')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Limpiar filtros' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver todas las ubicaciones' })).toHaveCount(0)
  })

  test('with every city, keeps "Todavía no hay artículos" (BRW-11)', async ({ page }) => {
    await logIn(page)
    await mockSearch(page, () => [])

    await page.goto('/feed?city=all')

    await expect(page.getByText('Todavía no hay artículos')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver todas las ubicaciones' })).toHaveCount(0)
  })
})
