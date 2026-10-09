import { expect, test, type Page, type Route } from './fixtures/test'
import {
  listingNotEditableError,
  notListingOwnerError,
  photoValidationError,
} from './fixtures/edit-listing'
import { categories } from './fixtures/feed'
import {
  internalError,
  listingDetail,
  listingDetailForBuyer,
  listingNotFoundError,
  ownListingDetail,
  type ListingDetailFixture,
} from './fixtures/listings'
import { activeItem } from './fixtures/my-listings'
import {
  categoryNotFoundError,
  invalidPhotoKeyError,
  photoFile,
  uploadedPhoto,
} from './fixtures/new-listing'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const EDIT = `/listings/${listingDetail.id}/edit`
const [photo0, photo1, photo2] = ownListingDetail.photos

/** Logs in as the seller of `activeItem`, with the categories the form needs. */
async function logInAsSeller(page: Page) {
  await logIn(page)
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ status: 200, json: categories }),
  )
  await page.route('**/api/v1/me/listings?*', (route) =>
    route.fulfill({ status: 200, json: [activeItem] }),
  )
}

/**
 * Answers GET with `listing` and PATCH with `onSave` (by default the listing
 * itself), and records each PATCH body.
 */
async function mockListing(
  page: Page,
  listing: ListingDetailFixture = ownListingDetail,
  onSave: (route: Route) => Promise<void> = (route) =>
    route.fulfill({ status: 200, json: listing }),
) {
  const saved: unknown[] = []
  await page.route(`**/api/v1/listings/${listing.id}`, (route) => {
    if (route.request().method() !== 'PATCH') {
      return route.fulfill({ status: 200, json: listing })
    }
    saved.push(route.request().postDataJSON())
    return onSave(route)
  })
  return saved
}

const saveButton = (page: Page) => page.getByRole('button', { name: 'Guardar cambios' })

test('opens the form prefilled with the listing as it is now (C3)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page)

  await page.goto(EDIT)

  await expect(page.getByRole('heading', { name: 'Editar artículo' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(3)
  await expect(page.getByText('Portada', { exact: true })).toHaveCount(1)
  await expect(page.getByLabel('Título')).toHaveValue('Aparador de teca mediados de siglo')
  await expect(
    page.getByRole('group', { name: 'Categoría' }).getByRole('button', { name: 'Muebles' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('group', { name: 'Condición' }).getByRole('button', { name: 'Poco uso' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Precio')).toHaveValue('185')
  await expect(page.getByLabel('Descripción')).toHaveValue(ownListingDetail.description)
  await expect(page.getByRole('link', { name: 'Volver' })).toHaveAttribute(
    'href',
    `/listings/${listingDetail.id}`,
  )
})

test('saves the details and the whole photo set, then returns to My Listings (LST-12)', async ({ page }) => {
  await logInAsSeller(page)
  const saved = await mockListing(page)
  await page.route('**/api/v1/uploads/photos', (route) =>
    route.fulfill({ status: 201, json: uploadedPhoto(1) }),
  )

  await page.goto(EDIT)
  await page.getByRole('button', { name: 'Quitar foto 1' }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Agregar foto' }).click()
  await (await chooser).setFiles([photoFile()])
  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(3)
  await page.getByLabel('Título').fill('Aparador de teca restaurado')
  await page.getByRole('group', { name: 'Condición' }).getByRole('button', { name: 'Como nuevo' }).click()
  await page.getByLabel('Precio').fill('150')
  await saveButton(page).click()

  await expect(page).toHaveURL('/listings')
  await expect(page.getByRole('status').getByText('Cambios guardados')).toBeVisible()
  expect(saved).toEqual([
    {
      categoryId: ownListingDetail.category.id,
      title: 'Aparador de teca restaurado',
      description: ownListingDetail.description,
      condition: 'LIKE_NEW',
      priceCents: 15000,
      photos: [
        { photoId: photo1.id },
        { photoId: photo2.id },
        { storageKey: uploadedPhoto(1).storageKey },
      ],
    },
  ])
})

test('shows the same field errors as publishing and saves nothing (LST-1, LST-3)', async ({ page }) => {
  await logInAsSeller(page)
  const saved = await mockListing(page)

  await page.goto(EDIT)
  for (const n of [3, 2, 1]) {
    await page.getByRole('button', { name: `Quitar foto ${n}` }).click()
  }
  await page.getByLabel('Título').fill('ab')
  await saveButton(page).click()

  await expect(page.getByText('Agrega al menos una foto')).toBeVisible()
  await expect(page.getByText('Escribe al menos 3 caracteres')).toBeVisible()
  await expect(page).toHaveURL(EDIT)
  expect(saved).toEqual([])
})

test('keeps the photos in their new order, the first one being the cover (LST-12)', async ({ page }) => {
  await logInAsSeller(page)
  const saved = await mockListing(page)

  await page.goto(EDIT)
  await page.getByRole('button', { name: 'Quitar foto 1' }).click()
  await saveButton(page).click()

  await expect(page).toHaveURL('/listings')
  expect(saved).toEqual([
    expect.objectContaining({ photos: [{ photoId: photo1.id }, { photoId: photo2.id }] }),
  ])
  expect(JSON.stringify(saved)).not.toContain(photo0.id)
})

test('explains that a reserved listing can no longer be edited (LST-11)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page, ownListingDetail, (route) =>
    route.fulfill({ status: 409, json: listingNotEditableError }),
  )

  await page.goto(EDIT)
  await page.getByLabel('Título').fill('Aparador de teca restaurado')
  await saveButton(page).click()

  await expect(page.getByText('Ya no puedes editar este artículo')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis artículos' })).toHaveAttribute('href', '/listings')
  await expect(saveButton(page)).toHaveCount(0)
})

test.describe('a listing that is no longer Active', () => {
  for (const status of ['PENDING', 'COMPLETED'] as const) {
    test(`shows no form when the listing is ${status} (LST-11)`, async ({ page }) => {
      await logInAsSeller(page)
      await mockListing(page, {
        ...ownListingDetail,
        status,
        pickupOptions: [],
        viewer: { isSeller: true, canReserve: false, canEdit: false },
      })

      await page.goto(EDIT)

      await expect(page.getByText('Ya no puedes editar este artículo')).toBeVisible()
      await expect(saveButton(page)).toHaveCount(0)
    })
  }
})

test('marks the category when it no longer exists (LST-1)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page, ownListingDetail, (route) =>
    route.fulfill({ status: 422, json: categoryNotFoundError }),
  )

  await page.goto(EDIT)
  await saveButton(page).click()

  await expect(page.getByText('Esta categoría ya no existe. Elige otra.')).toBeVisible()
  await expect(page.getByRole('status').getByText('Revisa los datos marcados.')).toBeVisible()
  await expect(page).toHaveURL(EDIT)
})

test('asks to upload the new photos again when the API rejects one (LST-12)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page, ownListingDetail, (route) =>
    route.fulfill({ status: 422, json: invalidPhotoKeyError }),
  )

  await page.goto(EDIT)
  await saveButton(page).click()

  await expect(page.getByText('Quita las fotos nuevas y vuelve a subirlas.')).toBeVisible()
  await expect(page.getByRole('status').getByText('Revisa los datos marcados.')).toBeVisible()
  await expect(page).toHaveURL(EDIT)
})

test('marks the photos when the API rejects the photo set (LST-1, LST-12)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page, ownListingDetail, (route) =>
    route.fulfill({ status: 400, json: photoValidationError }),
  )

  const photosHint = page.getByText('La primera foto es la portada. JPG, PNG o WebP de hasta 5 MB.')
  await page.goto(EDIT)
  await expect(photosHint).toBeVisible()
  await saveButton(page).click()

  // Only the Fotos field is marked: its error replaces its hint.
  await expect(page.getByText('Revisa este dato.')).toHaveCount(1)
  await expect(page.getByText('Revisa este dato.')).toBeVisible()
  await expect(photosHint).toHaveCount(0)
  await expect(page.getByRole('status').getByText('Revisa los datos marcados.')).toBeVisible()
})

test('keeps the changes and lets me retry when saving fails', async ({ page }) => {
  await logInAsSeller(page)
  let failing = true
  const saved = await mockListing(page, ownListingDetail, (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: ownListingDetail }),
  )

  await page.goto(EDIT)
  await page.getByLabel('Título').fill('Aparador de teca restaurado')
  await saveButton(page).click()

  await expect(
    page.getByRole('status').getByText('No pudimos guardar los cambios. Inténtalo de nuevo.'),
  ).toBeVisible()
  await expect(page.getByLabel('Título')).toHaveValue('Aparador de teca restaurado')
  failing = false
  await saveButton(page).click()
  await expect(page).toHaveURL('/listings')
  expect(saved).toHaveLength(2)
})

test('sends another seller’s listing to the buyer view (LST-11)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page, listingDetailForBuyer)

  await page.goto(EDIT)

  await expect(page).toHaveURL(`/items/${listingDetail.id}`)
})

test('sends me to the buyer view when the API says I am not the owner (LST-11)', async ({ page }) => {
  await logInAsSeller(page)
  await mockListing(page, ownListingDetail, (route) =>
    route.fulfill({ status: 403, json: notListingOwnerError }),
  )

  await page.goto(EDIT)
  await saveButton(page).click()

  await expect(page).toHaveURL(`/items/${listingDetail.id}`)
})

test('shows a loading state while the listing loads', async ({ page }) => {
  await logInAsSeller(page)
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/api/v1/listings/${listingDetail.id}`, async (route) => {
    await held
    await route.fulfill({ status: 200, json: ownListingDetail })
  })

  await page.goto(EDIT)

  await expect(page.getByRole('status').getByText('Cargando artículo…')).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: 'Editar artículo' })).toBeVisible()
})

test('explains a listing that does not exist', async ({ page }) => {
  await logInAsSeller(page)
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )

  await page.goto(EDIT)

  await expect(page.getByText('Este artículo no existe')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver mis artículos' })).toHaveAttribute('href', '/listings')
})

test('explains when the listing cannot load and lets me retry', async ({ page }) => {
  await logInAsSeller(page)
  let failing = true
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: ownListingDetail }),
  )

  await page.goto(EDIT)

  await expect(page.getByText('No pudimos cargar el artículo')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Editar artículo' })).toBeVisible()
})
