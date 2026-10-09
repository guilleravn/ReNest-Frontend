import { expect, type Locator } from './test'

/** Minimum touch target on mobile, in CSS pixels. */
const MIN_TAP_TARGET = 44

/** Fails unless the control's hit area is at least 44×44px. */
export async function expectTapTarget(control: Locator) {
  await expect(control).toBeVisible()
  const box = await control.boundingBox()
  expect(box?.width, 'tap target width').toBeGreaterThanOrEqual(MIN_TAP_TARGET)
  expect(box?.height, 'tap target height').toBeGreaterThanOrEqual(MIN_TAP_TARGET)
}
