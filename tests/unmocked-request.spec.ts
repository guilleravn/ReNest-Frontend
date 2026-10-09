import { expect, test } from './fixtures/test'

// The body passes on its own; only the guard in fixtures/test.ts fails it.
// test.fail() goes last, so a body that breaks fails for real instead of
// counting as the expected failure.
test('fails a test whose page makes an unmocked API request', async ({ page }) => {
  const requested = page.waitForRequest('**/api/v1/categories')

  await page.goto('/feed')

  await requested
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  test.fail()
})
