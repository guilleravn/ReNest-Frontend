import { expect, test } from './fixtures/test'
import { fakeJwt } from './fixtures/auth'
import { logIn } from './fixtures/session'
import { mockEmptyFeed } from './fixtures/feed'

test('sends a logged-out visitor from / to the public feed', async ({ page }) => {
  await mockEmptyFeed(page)
  await page.goto('/')

  await expect(page).toHaveURL(/\/feed$/)
})

test('sends a logged-in user from / to the feed', async ({ page }) => {
  await mockEmptyFeed(page)
  await logIn(page, { token: fakeJwt(3600) })
  await page.goto('/')

  await expect(page).toHaveURL(/\/feed$/)
})
