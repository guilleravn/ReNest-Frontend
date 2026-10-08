import { expect, test, type Page } from '@playwright/test'
import { authResponse } from './fixtures/auth'
import { categories, internalError } from './fixtures/feed'
import { invalidFileError, photoFile, uploadedPhoto } from './fixtures/new-listing'

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

async function mockCategories(page: Page) {
  await page.route('**/api/v1/categories', (route) =>
    route.fulfill({ status: 200, json: categories }),
  )
}

/** Answers each upload with the next photo, and counts the uploads. */
async function mockUploads(page: Page) {
  const uploads = { count: 0 }
  await page.route('**/api/v1/uploads/photos', (route) => {
    uploads.count += 1
    return route.fulfill({ status: 201, json: uploadedPhoto(uploads.count) })
  })
  return uploads
}

async function addPhotos(page: Page, files = [photoFile()]) {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Agregar foto' }).click()
  await (await chooser).setFiles(files)
}


async function fillDetails(page: Page) {
  await addPhotos(page, [photoFile('a.png'), photoFile('b.png')])
  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(2)
  await page.getByLabel('Título').fill('Silla de comedor en roble')
  await page.getByRole('group', { name: 'Categoría' }).getByRole('button', { name: 'Muebles' }).click()
  await page.getByRole('group', { name: 'Condición' }).getByRole('button', { name: 'Poco uso' }).click()
  await page.getByLabel('Precio').fill('180')
  await page.getByLabel('Descripción').fill('Roble macizo, sin rayones.')
}

test('opens the new listing form from My Listings (LST-1)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  await page.route('**/api/v1/me/listings?*', (route) => route.fulfill({ status: 200, json: [] }))

  await page.goto('/listings')
  await expect(page.getByRole('link', { name: 'Publicar un artículo' })).toBeVisible()
  await page.getByRole('link', { name: 'Nuevo artículo' }).click()

  await expect(page).toHaveURL('/listings/new')
  await expect(page.getByRole('heading', { name: 'Describe tu artículo' })).toBeVisible()
  await expect(page.getByText('Paso 1 de 2')).toBeVisible()
})

test('uploads the photos, marks the first as the cover and continues to step 2 without saving (LST-1, LST-9)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  const uploads = await mockUploads(page)
  let published = false
  await page.route('**/api/v1/listings', (route) => {
    published = true
    return route.fulfill({ status: 500, json: internalError })
  })

  await page.goto('/listings/new')
  await fillDetails(page)

  expect(uploads.count).toBe(2)
  await expect(page.getByText('Portada', { exact: true })).toHaveCount(1)
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Disponibilidad de entrega' })).toBeVisible()
  await expect(page.getByText('Paso 2 de 2')).toBeVisible()
  expect(published).toBe(false)
})

test('shows every missing field inline and stays on step 1 (LST-1)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)

  await page.goto('/listings/new')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Agrega al menos una foto')).toBeVisible()
  await expect(page.getByText('Escribe al menos 3 caracteres')).toBeVisible()
  await expect(page.getByText('Elige una categoría')).toBeVisible()
  await expect(page.getByText('Elige una condición')).toBeVisible()
  await expect(page.getByText('Ingresa un precio entero de al menos $1')).toBeVisible()
  await expect(page.getByText('Agrega una descripción')).toBeVisible()
  await expect(page.getByText('Paso 1 de 2')).toBeVisible()
})

test('rejects a title over 120 characters, a description over 2000 and a price outside $1–$20.000.000 (LST-3, LST-5, GEN-2)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  await mockUploads(page)

  await page.goto('/listings/new')
  await fillDetails(page)
  await page.getByLabel('Título').fill('t'.repeat(121))
  await page.getByLabel('Descripción').fill('d'.repeat(2001))
  await page.getByLabel('Precio').fill('0')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('Usa como máximo 120 caracteres')).toBeVisible()
  await expect(page.getByText('Usa como máximo 2000 caracteres')).toBeVisible()
  await expect(page.getByText('Ingresa un precio entero de al menos $1')).toBeVisible()

  await page.getByLabel('Precio').fill('20000001')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Ingresa un precio de hasta $20.000.000')).toBeVisible()

  await page.getByLabel('Precio').fill('12.50')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Ingresa un precio entero de al menos $1')).toBeVisible()
})

test('accepts up to 3 photos and hides the add tile at the limit (LST-1)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  const uploads = await mockUploads(page)

  await page.goto('/listings/new')
  await addPhotos(page, [photoFile('a.png'), photoFile('b.png'), photoFile('c.png'), photoFile('d.png')])

  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(3)
  await expect(page.getByText('Puedes agregar hasta 3 fotos')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Agregar foto' })).toHaveCount(0)
  expect(uploads.count).toBe(3)

  await page.getByRole('button', { name: 'Quitar foto 1' }).click()
  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Agregar foto' })).toBeVisible()
})

test('rejects a file that is not JPG, PNG or WebP without uploading it (LST-2)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  const uploads = await mockUploads(page)

  await page.goto('/listings/new')
  await addPhotos(page, [photoFile('animado.gif', 'image/gif')])

  await expect(page.getByText('Usa fotos JPG, PNG o WebP')).toBeVisible()
  expect(uploads.count).toBe(0)
})

test('explains a photo the API rejects with INVALID_FILE (LST-2)', async ({ page }) => {
  await logIn(page)
  await mockCategories(page)
  await page.route('**/api/v1/uploads/photos', (route) =>
    route.fulfill({ status: 400, json: invalidFileError }),
  )

  await page.goto('/listings/new')
  await addPhotos(page)

  await expect(page.getByText('Usa fotos JPG, PNG o WebP de hasta 5 MB')).toBeVisible()
  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(0)
})

test('shows the categories loading, then an error with a retry', async ({ page }) => {
  await logIn(page)
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  let failing = true
  await page.route('**/api/v1/categories', async (route) => {
    await gate
    return failing
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: categories })
  })

  await page.goto('/listings/new')
  await expect(page.getByText('Cargando categorías…')).toBeVisible()
  release()
  await expect(page.getByText('No pudimos cargar las categorías.')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByRole('group', { name: 'Categoría' }).getByRole('button', { name: 'Muebles' })).toBeVisible()
})

async function goToPickupStep(page: Page) {
  await logIn(page)
  await mockCategories(page)
  await mockUploads(page)
  await page.goto('/listings/new')
  await fillDetails(page)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Disponibilidad de entrega' })).toBeVisible()
}

async function addPickupOption(
  page: Page,
  { place = 'Plaza Principal', days = ['Lun', 'Mié'], from = '18:30', to = '20:00' } = {},
) {
  await page.getByRole('button', { name: 'Agregar horario y lugar' }).click()
  const sheet = page.getByRole('dialog', { name: 'Agregar horario y lugar' })
  await sheet.getByLabel('Punto de encuentro').fill(place)
  for (const day of days) {
    await sheet.getByRole('group', { name: 'Días' }).getByRole('button', { name: day }).click()
  }
  await sheet.getByLabel('Desde').fill(from)
  await sheet.getByLabel('Hasta').fill(to)
  await sheet.getByRole('button', { name: 'Agregar opción' }).click()
}

const pickupList = (page: Page) => page.getByRole('region', { name: 'Opciones de entrega' })

test('adds a pickup pair with a success toast, after a public-place hint (LST-7, LST-8, LST-9)', async ({ page }) => {
  await goToPickupStep(page)

  await page.getByRole('button', { name: 'Agregar horario y lugar' }).click()
  await expect(page.getByText('Usa solo lugares públicos', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await addPickupOption(page)

  await expect(page.getByText('Opción de entrega agregada')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(pickupList(page).getByRole('listitem')).toHaveCount(1)
  await expect(pickupList(page).getByText('Plaza Principal')).toBeVisible()
  await expect(pickupList(page).getByText('los lunes y miércoles · 18:30–20:00')).toBeVisible()
})

test('shows the pair errors inline and adds nothing (LST-7)', async ({ page }) => {
  await goToPickupStep(page)

  await page.getByRole('button', { name: 'Agregar horario y lugar' }).click()
  const sheet = page.getByRole('dialog', { name: 'Agregar horario y lugar' })
  await sheet.getByLabel('Punto de encuentro').fill('ab')
  await sheet.getByRole('button', { name: 'Agregar opción' }).click()

  await expect(sheet.getByText('Escribe al menos 3 caracteres')).toBeVisible()
  await expect(sheet.getByText('Elige al menos un día')).toBeVisible()
  await expect(sheet.getByText('Elige la hora de inicio')).toBeVisible()
  await expect(sheet.getByText('Elige la hora de fin')).toBeVisible()

  await sheet.getByLabel('Punto de encuentro').fill('Plaza Principal')
  await sheet.getByRole('group', { name: 'Días' }).getByRole('button', { name: 'Sáb' }).click()
  await sheet.getByLabel('Desde').fill('13:00')
  await sheet.getByLabel('Hasta').fill('13:00')
  await sheet.getByRole('button', { name: 'Agregar opción' }).click()

  await expect(sheet.getByText('Debe ser después de la hora de inicio')).toBeVisible()
  await sheet.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByText('Aún no agregaste opciones de entrega.')).toBeVisible()
})

test('allows at most 3 pickup pairs, with a toast for each one (LST-6, LST-9)', async ({ page }) => {
  await goToPickupStep(page)

  for (const place of ['Plaza Principal', 'Café Toscano', 'Parque México']) {
    await addPickupOption(page, { place })
    await expect(page.getByText('Opción de entrega agregada')).toBeVisible()
    await page.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page.getByText('Opción de entrega agregada')).toHaveCount(0)
  }

  await expect(pickupList(page).getByRole('listitem')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Agregar horario y lugar' })).toHaveCount(0)
  await expect(page.getByText('Ya agregaste el máximo de 3 opciones.')).toBeVisible()

  await page.getByRole('button', { name: 'Quitar Café Toscano' }).click()
  await expect(pickupList(page).getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Agregar horario y lugar' })).toBeVisible()
})

test('keeps the details when going back to step 1 (LST-9)', async ({ page }) => {
  await goToPickupStep(page)

  await page.getByRole('button', { name: 'Volver a los datos del artículo' }).click()

  await expect(page.getByLabel('Título')).toHaveValue('Silla de comedor en roble')
  await expect(page.getByRole('img', { name: /Foto \d del artículo/ })).toHaveCount(2)
})
