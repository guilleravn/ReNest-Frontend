import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Scrolls `target` to the bottom edge of the viewport, the way the browser
 * brings a focused field into view, and checks the action bar doesn't cover it.
 */
export async function expectNotCoveredByActionBar(page: Page, target: Locator) {
  const bar = page.getByRole('region', { name: 'Acciones' })
  await expect(bar).toBeVisible()
  await expect(target).toBeVisible()

  // The bar's height is measured after render, so retry until it settles.
  await expect(async () => {
    await target.evaluate((element) => element.scrollIntoView({ block: 'end' }))
    const targetBox = await target.boundingBox()
    const barBox = await bar.boundingBox()
    expect(targetBox).not.toBeNull()
    expect(barBox).not.toBeNull()
    expect(targetBox!.y + targetBox!.height).toBeLessThanOrEqual(barBox!.y + 1)
  }).toPass()
}
