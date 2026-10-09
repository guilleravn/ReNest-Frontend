import { test as base, expect } from '@playwright/test'

export * from '@playwright/test'

/**
 * Playwright's `test`, plus a guard: an API request no spec route answers is
 * aborted and fails the test, naming it. The catch-all is routed first, so any
 * route a spec adds later wins over it.
 */
export const test = base.extend<{ failOnUnmockedRequests: void }>({
  failOnUnmockedRequests: [
    async ({ page }, use) => {
      const unmocked: string[] = []
      await page.route('**/api/v1/**', (route) => {
        const { pathname, search } = new URL(route.request().url())
        unmocked.push(`${route.request().method()} ${pathname}${search}`)
        return route.abort()
      })

      await use()

      const named = [...new Set(unmocked)]
      expect(named, `unmocked request(s):\n  ${named.join('\n  ')}`).toEqual([])
    },
    { auto: true },
  ],
})
