import { expect, test, type Page, type Route } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { listingNotEditableError } from './fixtures/edit-listing'
import {
  internalError,
  listingDetail,
  listingDetailForBuyer,
  listingNotFoundError,
  ownListingDetail,
  type ListingDetailFixture,
} from './fixtures/listings'
import {
  addedPickupOption,
  lastPickupOptionError,
  listingWithOnePair,
  listingWithThreePairs,
  pendingOwnListing,
  pickupOptionLimitError,
} from './fixtures/pickup-times'

test.use({ viewport: { width: 375, height: 812 } })

const PICKUP_TIMES = `/listings/${listingDetail.id}/pickup-times`
const PAIRS = `**/api/v1/listings/${listingDetail.id}/pickup-options`
const [cafe, plaza] = ownListingDetail.pickupOptions

async function logIn(page: Page) {
  await page.addInitScript(
    (token) => localStorage.setItem('renest.accessToken', token),
    authResponse.accessToken,
  )
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({ status: 200, json: authResponse.user }),
  )
}

/**
 * Answers GET /listings/:id with `server.listing`; a test changes it to
 * simulate a change made elsewhere (another tab).
 */
async function mockListing(page: Page, listing: ListingDetailFixture) {
  const server = { listing }
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    route.fulfill({ status: 200, json: server.listing }),
  )
  return server
}

/** Answers POST with `onAdd` and records each body. */
async function mockAdd(
  page: Page,
  onAdd: (route: Route) => Promise<void> = (route) =>
    route.fulfill({ status: 201, json: addedPickupOption }),
) {
  const bodies: unknown[] = []
  await page.route(PAIRS, (route) => {
    bodies.push(route.request().postDataJSON())
    return onAdd(route)
  })
  return bodies
}

/** Answers DELETE with `onRemove` and records each removed pair id. */
async function mockRemove(
  page: Page,
  onRemove: (route: Route) => Promise<void> = (route) => route.fulfill({ status: 204 }),
) {
  const removed: string[] = []
  await page.route(`${PAIRS}/*`, (route) => {
    removed.push(route.request().url().split('/').at(-1)!)
    return onRemove(route)
  })
  return removed
}

const pairList = (page: Page) => page.getByRole('region', { name: 'Opciones de entrega' })
const addButton = (page: Page) => page.getByRole('button', { name: 'Agregar horario y lugar' })
const sheet = (page: Page) => page.getByRole('dialog', { name: 'Agregar horario y lugar' })

async function fillNewPair(page: Page) {
  await addButton(page).click()
  await sheet(page).getByLabel('Punto de encuentro').fill('  Parque Central ')
  for (const day of ['Lun', 'Mié']) {
    await sheet(page).getByRole('group', { name: 'Días' }).getByRole('button', { name: day }).click()
  }
  await sheet(page).getByLabel('Desde').fill('17:00')
  await sheet(page).getByLabel('Hasta').fill('19:30')
  await sheet(page).getByRole('button', { name: 'Agregar opción' }).click()
}

test('lists the listing’s current pairs (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)

  await page.goto(PICKUP_TIMES)

  await expect(page.getByRole('heading', { name: 'Mis horarios de recogida' })).toBeVisible()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(2)
  await expect(pairList(page).getByText(cafe.locationLabel)).toBeVisible()
  await expect(pairList(page).getByText('los sábados · 10:00–13:00')).toBeVisible()
  await expect(pairList(page).getByText(plaza.locationLabel)).toBeVisible()
  await expect(addButton(page)).toBeEnabled()
  await expect(page.getByRole('link', { name: 'Volver' })).toHaveAttribute(
    'href',
    `/listings/${listingDetail.id}`,
  )
})

test('adds a pair, which is saved right away (SAL-6, LST-7)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  const bodies = await mockAdd(page)

  await page.goto(PICKUP_TIMES)
  await fillNewPair(page)

  await expect(sheet(page)).toBeHidden()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(3)
  await expect(pairList(page).getByText('Parque Central')).toBeVisible()
  await expect(page.getByRole('status').getByText('Opción de entrega agregada')).toBeVisible()
  expect(bodies).toEqual([
    {
      locationLabel: 'Parque Central',
      weekdays: ['MONDAY', 'WEDNESDAY'],
      startTime: '17:00',
      endTime: '19:30',
    },
  ])
})

test('checks the pair before sending it and sends nothing when invalid (LST-7)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  const bodies = await mockAdd(page)

  await page.goto(PICKUP_TIMES)
  await addButton(page).click()
  await sheet(page).getByLabel('Punto de encuentro').fill('ab')
  await sheet(page).getByRole('button', { name: 'Agregar opción' }).click()

  await expect(sheet(page).getByText('Escribe al menos 3 caracteres')).toBeVisible()
  expect(bodies).toEqual([])
})

test('removes a pair after confirming (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  const removed = await mockRemove(page)

  await page.goto(PICKUP_TIMES)
  await page.getByRole('button', { name: `Quitar ${plaza.locationLabel}` }).click()
  const dialog = page.getByRole('dialog', { name: '¿Quitar esta opción?' })
  await expect(dialog.getByText('Plaza Principal, los martes y jueves · 18:00–20:00')).toBeVisible()
  await dialog.getByRole('button', { name: 'Sí, quitar' }).click()

  await expect(dialog).toBeHidden()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(1)
  await expect(pairList(page).getByText(plaza.locationLabel)).toBeHidden()
  await expect(page.getByRole('status').getByText('Opción de entrega quitada')).toBeVisible()
  expect(removed).toEqual([plaza.id])
})

test('keeps the pair when I cancel the removal (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  const removed = await mockRemove(page)

  await page.goto(PICKUP_TIMES)
  await page.getByRole('button', { name: `Quitar ${plaza.locationLabel}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()

  await expect(pairList(page).getByRole('listitem')).toHaveCount(2)
  expect(removed).toEqual([])
})

test('disables adding at 3 pairs and explains why (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingWithThreePairs)

  await page.goto(PICKUP_TIMES)

  await expect(pairList(page).getByRole('listitem')).toHaveCount(3)
  await expect(addButton(page)).toBeDisabled()
  await expect(page.getByText('Ya tienes el máximo de 3 opciones. Quita una para agregar otra.')).toBeVisible()
})

test('disables removing the only pair and explains why (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingWithOnePair)

  await page.goto(PICKUP_TIMES)

  await expect(page.getByRole('button', { name: `Quitar ${cafe.locationLabel}` })).toBeDisabled()
  await expect(page.getByText('Necesitas al menos una opción. Agrega otra antes de quitar esta.')).toBeVisible()
})

test('enables removing again once a second pair is added (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingWithOnePair)
  await mockAdd(page)

  await page.goto(PICKUP_TIMES)
  await fillNewPair(page)

  await expect(page.getByRole('button', { name: `Quitar ${cafe.locationLabel}` })).toBeEnabled()
})

test('shows the current pairs when the limit was reached elsewhere (SAL-6)', async ({ page }) => {
  await logIn(page)
  const server = await mockListing(page, ownListingDetail)
  await mockAdd(page, (route) => {
    server.listing = listingWithThreePairs
    return route.fulfill({ status: 409, json: pickupOptionLimitError })
  })

  await page.goto(PICKUP_TIMES)
  await fillNewPair(page)

  await expect(sheet(page)).toBeHidden()
  await expect(page.getByRole('status').getByText('Tus horarios cambiaron. Te mostramos los actuales.')).toBeVisible()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(3)
  await expect(addButton(page)).toBeDisabled()
})

test('shows the current pairs when the last one would be removed (SAL-6)', async ({ page }) => {
  await logIn(page)
  const server = await mockListing(page, ownListingDetail)
  await mockRemove(page, (route) => {
    server.listing = listingWithOnePair
    return route.fulfill({ status: 409, json: lastPickupOptionError })
  })

  await page.goto(PICKUP_TIMES)
  await page.getByRole('button', { name: `Quitar ${cafe.locationLabel}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, quitar' }).click()

  await expect(page.getByRole('status').getByText('Tus horarios cambiaron. Te mostramos los actuales.')).toBeVisible()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('button', { name: `Quitar ${cafe.locationLabel}` })).toBeDisabled()
})

test('explains that the listing was reserved while adding (C2)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  await mockAdd(page, (route) => route.fulfill({ status: 409, json: listingNotEditableError }))

  await page.goto(PICKUP_TIMES)
  await fillNewPair(page)

  await expect(page.getByText('Ya no puedes cambiar los horarios')).toBeVisible()
  await expect(addButton(page)).toBeHidden()
})

test('explains that the listing was reserved while removing (C2)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  await mockRemove(page, (route) => route.fulfill({ status: 409, json: listingNotEditableError }))

  await page.goto(PICKUP_TIMES)
  await page.getByRole('button', { name: `Quitar ${plaza.locationLabel}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, quitar' }).click()

  await expect(page.getByText('Ya no puedes cambiar los horarios')).toBeVisible()
  await expect(pairList(page)).toBeHidden()
})

test('keeps the sheet and what I typed when adding fails (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  await mockAdd(page, (route) => route.fulfill({ status: 500, json: internalError }))

  await page.goto(PICKUP_TIMES)
  await fillNewPair(page)

  await expect(sheet(page).getByRole('alert')).toHaveText('No pudimos agregar la opción. Inténtalo de nuevo.')
  await expect(sheet(page).getByLabel('Punto de encuentro')).toHaveValue('  Parque Central ')
  await sheet(page).getByRole('button', { name: 'Cancelar' }).click()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(2)
})

test('keeps the pair when removing fails (SAL-6)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, ownListingDetail)
  await mockRemove(page, (route) => route.fulfill({ status: 500, json: internalError }))

  await page.goto(PICKUP_TIMES)
  await page.getByRole('button', { name: `Quitar ${plaza.locationLabel}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, quitar' }).click()

  await expect(page.getByRole('status').getByText('No pudimos quitar la opción. Inténtalo de nuevo.')).toBeVisible()
  await expect(pairList(page).getByRole('listitem')).toHaveCount(2)
})

test('does not offer changes on a reserved listing (C2)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, pendingOwnListing)

  await page.goto(PICKUP_TIMES)

  await expect(page.getByText('Ya no puedes cambiar los horarios')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis artículos' })).toHaveAttribute('href', '/listings')
  await expect(addButton(page)).toBeHidden()
})

test('shows someone else’s listing as a buyer sees it', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingDetailForBuyer)

  await page.goto(PICKUP_TIMES)

  await expect(page).toHaveURL(`/items/${listingDetail.id}`)
})

test('shows a loading state while the listing loads', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/listings/${listingDetail.id}`, async (route) => {
    await held
    await route.fulfill({ status: 200, json: ownListingDetail })
  })

  await page.goto(PICKUP_TIMES)

  await expect(page.getByRole('status').getByText('Cargando artículo…')).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: 'Mis horarios de recogida' })).toBeVisible()
})

test('explains a listing that does not exist', async ({ page }) => {
  await logIn(page)
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )

  await page.goto(PICKUP_TIMES)

  await expect(page.getByText('Este artículo no existe')).toBeVisible()
})

test('explains when the listing cannot load and lets me retry', async ({ page }) => {
  await logIn(page)
  let failing = true
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: ownListingDetail }),
  )

  await page.goto(PICKUP_TIMES)

  await expect(page.getByText('No pudimos cargar el artículo')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Mis horarios de recogida' })).toBeVisible()
})
