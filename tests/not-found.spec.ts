import { expect, test } from './fixtures/test'
import { mockEmptyFeed } from './fixtures/feed'
import { logIn } from './fixtures/session'

test.use({ viewport: { width: 375, height: 812 } })

test('says an unknown page does not exist and leads back to the feed', async ({ page }) => {
  await mockEmptyFeed(page)
  await page.goto('/no-existe')

  await expect(page.getByText('No encontramos esta página')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()

  await page.getByRole('link', { name: 'Ver artículos' }).click()

  await expect(page).toHaveURL('/feed')
})

test('keeps the account menu on an unknown page for a logged-in user', async ({ page }) => {
  await logIn(page)

  await page.goto('/items/abc/unknown')

  await expect(page.getByText('No encontramos esta página')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mi cuenta' })).toBeVisible()
})
