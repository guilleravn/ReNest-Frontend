import { expect, test } from '@playwright/test'
import { fakeJwt } from './fixtures/auth'

test('sends a logged-out visitor from / to the public feed', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/feed$/)
})

test('sends a logged-in user from / to the feed', async ({ page }) => {
  await page.addInitScript((token) => {
    localStorage.setItem('renest.accessToken', token)
  }, fakeJwt(3600))
  await page.goto('/')

  await expect(page).toHaveURL(/\/feed$/)
})
