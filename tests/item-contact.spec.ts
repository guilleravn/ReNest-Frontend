import { expect, test, type Page } from './fixtures/test'
import {
  internalError,
  listingDetail,
  listingDetailForBuyer,
  listingNotFoundError,
  type ListingDetailFixture,
} from './fixtures/listings'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

const CONTACT = `/items/${listingDetail.id}/contact`
const PREFILLED =
  'Hola Priya Mehta, vi tu "Aparador de teca mediados de siglo" ($185) en ReNest y tengo una pregunta.'

async function mockListing(page: Page, listing: ListingDetailFixture) {
  await page.route(`**/api/v1/listings/${listing.id}`, (route) =>
    route.fulfill({ status: 200, json: listing }),
  )
}

test("opens WhatsApp with the seller's number and a message naming the item (BRW-7, C1)", async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingDetailForBuyer)

  await page.goto(CONTACT)

  await expect(page.getByRole('heading', { name: '¿Preguntas sobre este producto?' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Vendedor' }).getByText('Priya Mehta')).toBeVisible()
  await expect(page.getByLabel('Tu mensaje')).toHaveValue(PREFILLED)
  const whatsapp = page.getByRole('link', { name: 'Abrir en WhatsApp' })
  await expect(whatsapp).toHaveAttribute(
    'href',
    `https://wa.me/525512345678?text=${encodeURIComponent(PREFILLED)}`,
  )
  await expect(whatsapp).toHaveAttribute('target', '_blank')
})

test('sends the message as edited by the buyer (BRW-7)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingDetailForBuyer)
  await page.goto(CONTACT)

  await page.getByLabel('Tu mensaje').fill('¿Aceptas $150?')

  await expect(page.getByRole('link', { name: 'Abrir en WhatsApp' })).toHaveAttribute(
    'href',
    `https://wa.me/525512345678?text=${encodeURIComponent('¿Aceptas $150?')}`,
  )
})

test('sends a logged-out visitor to login first (BRW-7, GEN-7)', async ({ page }) => {
  await page.goto(CONTACT)

  await expect(page).toHaveURL('/login')
})

test('sends to login when the API no longer recognizes the session and hides the phone (GEN-7)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, listingDetail)

  await page.goto(CONTACT)

  await expect(page).toHaveURL('/login')
  expect(await page.evaluate(() => localStorage.getItem('renest.accessToken'))).toBeNull()
})

test('sends the seller back to their listing (BRW-9)', async ({ page }) => {
  await logIn(page)
  await mockListing(page, {
    ...listingDetailForBuyer,
    viewer: { isSeller: true, canReserve: false, canEdit: true },
  })

  await page.goto(CONTACT)

  await expect(page).toHaveURL(`/items/${listingDetail.id}`)
})

test('shows an error with a retry when the listing fails to load', async ({ page }) => {
  await logIn(page)
  let apiDown = true
  await page.route(`**/api/v1/listings/${listingDetail.id}`, (route) =>
    apiDown
      ? route.fulfill({ status: 500, json: internalError })
      : route.fulfill({ status: 200, json: listingDetailForBuyer }),
  )
  await page.goto(CONTACT)
  await expect(page.getByText('No pudimos cargar el artículo')).toBeVisible()

  apiDown = false
  await page.getByRole('button', { name: 'Reintentar' }).click()

  await expect(page.getByLabel('Tu mensaje')).toHaveValue(PREFILLED)
})

test('says the listing does not exist on 404 LISTING_NOT_FOUND', async ({ page }) => {
  await logIn(page)
  await page.route('**/api/v1/listings/unknown', (route) =>
    route.fulfill({ status: 404, json: listingNotFoundError }),
  )

  await page.goto('/items/unknown/contact')

  await expect(page.getByText('Este artículo no existe')).toBeVisible()
})
