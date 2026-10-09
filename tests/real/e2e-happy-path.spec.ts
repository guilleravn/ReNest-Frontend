import { expect, test as base, type Page } from '@playwright/test'

// The full happy path on the real stack, told from each side: one test follows
// the seller, the other the buyer. Each opens one browser per person, drives
// both through the UI and asserts on what its protagonist sees.
const VIEWPORT = { width: 375, height: 812 }

// `other` is the second person in the story, in a browser of their own.
const test = base.extend<{ other: Page }>({
  other: async ({ browser, baseURL }, provide) => {
    const context = await browser.newContext({ baseURL, viewport: VIEWPORT })
    await provide(await context.newPage())
    await context.close()
  },
})
test.use({ viewport: VIEWPORT })
// Each test walks two people through the whole flow.
test.describe.configure({ timeout: 60_000 })

const PASSWORD = 'password123'
const runId = Date.now().toString(36)
const PHOTO = {
  name: 'foto.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  ),
}

type Person = { name: string; email: string; phone: string }

const sellerFor = (tag: string): Person => ({
  name: 'Vera Vendedora',
  email: `seller-${tag}-${runId}@example.com`,
  phone: '71234567',
})
const buyerFor = (tag: string): Person => ({
  name: 'Bruno Comprador',
  email: `buyer-${tag}-${runId}@example.com`,
  phone: '77654321',
})

async function register(page: Page, person: Person) {
  await page.goto('/register')
  await page.getByLabel('Nombre').fill(person.name)
  await page.getByLabel('Correo').fill(person.email)
  await page.getByLabel('Tu zona').selectOption({ label: 'Cochabamba, BO' })
  await page.getByLabel('Teléfono').fill(person.phone)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/feed$/)
}

async function goToMyListings(page: Page, tab: 'Activos' | 'En proceso' | 'Completados') {
  await page.getByRole('link', { name: 'Inicio de ReNest' }).click()
  await page.getByRole('link', { name: 'Mis artículos', exact: true }).click()
  await page.getByRole('link', { name: tab }).click()
}

// Returns the listing's public page, as buyers see it.
async function publishListing(page: Page, title: string) {
  await goToMyListings(page, 'Activos')
  await page.getByRole('link', { name: 'Nuevo artículo' }).click()

  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Agregar foto' }).click()
  await (await chooser).setFiles(PHOTO)
  await expect(page.getByRole('img', { name: 'Foto 1 del artículo' })).toBeVisible()
  await page.getByLabel('Título').fill(title)
  await page.getByRole('group', { name: 'Categoría' }).getByRole('button', { name: 'Hogar' }).click()
  await page.getByRole('button', { name: 'Poco uso' }).click()
  await page.getByLabel('Precio').fill('120')
  await page.getByLabel('Descripción').fill('Rodado 26, frenos nuevos.')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('button', { name: 'Agregar horario y lugar' }).click()
  const pickup = page.getByRole('dialog')
  await pickup.getByLabel('Punto de encuentro').fill('Plaza 14 de Septiembre')
  await pickup.getByRole('button', { name: 'Sáb' }).click()
  await pickup.getByLabel('Desde').fill('10:00')
  await pickup.getByLabel('Hasta').fill('12:00')
  await pickup.getByRole('button', { name: 'Agregar opción' }).click()

  await page.getByRole('button', { name: 'Publicar artículo' }).click()
  await page.getByRole('button', { name: 'Sí, publicar' }).click()
  await expect(page.getByRole('heading', { name: '¡Artículo publicado!' })).toBeVisible()

  const publicPage = page.getByRole('link', { name: 'Ver cómo lo ven los compradores' })
  return (await publicPage.getAttribute('href'))!
}

async function findListing(page: Page, title: string) {
  await page.getByRole('link', { name: 'Inicio de ReNest' }).click()
  await page.getByRole('searchbox', { name: 'Buscar por título' }).fill(title)
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

// From the listing's page.
async function reserve(page: Page) {
  await page.getByRole('link', { name: 'Agendar recogida' }).click()
  await page.getByRole('radio', { name: /Plaza 14 de Septiembre/ }).click()
  await page.getByRole('button', { name: 'Confirmar recogida' }).click()
  await page.getByRole('button', { name: 'Sí, reservar' }).click()
  await expect(page.getByText('¡Listo, es tuyo!')).toBeVisible()
}

async function confirmHandover(page: Page, title: string) {
  await goToMyListings(page, 'En proceso')
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await page.getByRole('button', { name: 'Confirmar entrega' }).click()
  await page.getByRole('button', { name: 'Sí, ya lo entregué' }).click()
  await expect(page.getByText('¡Venta completada!')).toBeVisible()
}

async function openPurchase(page: Page, title: string) {
  await page.getByRole('link', { name: 'Mis compras', exact: true }).click()
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

// From the purchase's page; ends on the rating screen.
async function confirmReception(page: Page) {
  await page.getByRole('link', { name: 'Marcar como recogido' }).click()
  const checklist = page.getByRole('group', { name: 'Marca lo que se cumple' })
  await checklist.getByRole('button', { name: 'El artículo coincide con las fotos y la descripción' }).click()
  await checklist.getByRole('button', { name: 'Funciona / sin daños no informados' }).click()
  await checklist.getByRole('button', { name: 'Incluye todas las partes y accesorios' }).click()
  await page.getByRole('checkbox', { name: 'Tengo el artículo conmigo ahora' }).check()
  await page.getByRole('button', { name: 'Confirmar recepción' }).click()
  await expect(page.getByRole('heading', { name: '¿Cómo te fue con Vera Vendedora?' })).toBeVisible()
}

async function rateSeller(page: Page, stars: number) {
  await page.getByRole('radio', { name: `${stars} estrellas` }).click()
  await page.getByRole('button', { name: 'Enviar calificación' }).click()
  await expect(page.getByText('Intercambio completado')).toBeVisible()
}

test('a seller publishes, hands the item over and sees their new rating', async ({
  page,
  other: buyer,
}) => {
  const title = `Bicicleta urbana ${runId} vendedor`
  await register(page, sellerFor('seller-flow'))

  const listingUrl = await publishListing(page, title)
  await page.getByRole('link', { name: 'Ver cómo lo ven los compradores' }).click()
  await expect(page.getByText('Sin calificaciones aún')).toBeVisible()

  await register(buyer, buyerFor('seller-flow'))
  await findListing(buyer, title)
  await reserve(buyer)

  await goToMyListings(page, 'En proceso')
  await expect(page.getByRole('link', { name: new RegExp(title) })).toContainText('Bruno Comprador')

  await confirmHandover(page, title)
  await page.getByRole('link', { name: 'Ver mis completados' }).click()
  await expect(page.getByRole('link', { name: new RegExp(title) })).toContainText(
    'Vendido a Bruno Comprador',
  )

  await openPurchase(buyer, title)
  await confirmReception(buyer)
  await rateSeller(buyer, 4)

  await page.goto(listingUrl)
  await expect(page.getByText('Ya no está disponible')).toBeVisible()
  await expect(page.getByText('4,0 · 1 reseña')).toBeVisible()
})
