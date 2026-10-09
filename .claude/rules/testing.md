---
paths:
  - "tests/**"
  - "playwright.config.ts"
---

# Frontend testing standards

Frontend tests are Playwright specs in `tests/`. There are no unit tests in R1 (see decision D-8 in the backend docs). Business rules are tested in the backend; here we test that each screen behaves correctly for the user.

## What to test

- **One spec per flow or screen** touched by the ticket (`tests/<flow>.spec.ts`), covering:
  - the happy path;
  - the states the ticket requires: loading, empty, error, and the API rejections the UI must explain (`401` → login, `409` → message).
- **Per ticket, mock the API** with `page.route()`, so specs are fast and don't need the backend. Mocked payloads must match `../ReNest-Backend/docs/api-contract.md`; keep them in `tests/fixtures/`.
  - Import `test` and `expect` from `./fixtures/test`, not `@playwright/test`. It fails any test whose page makes an API request no route answers, naming the request.
  - Start logged in with `logIn(page)` from `./fixtures/session`. It seeds the token and answers `/me` and the nav's counts empty; route them again to return other data.
  - The suite starts its own Vite on `:5175`, with the API proxy pointed at a port where nothing listens, so a running backend never answers it.
- **At release**, one end-to-end spec runs the full happy path against the real stack, with no mocks.

## Rules

- Locate elements the way a user would: `getByRole`, `getByLabel`, `getByText`. Never use CSS classes or test IDs unless there is no accessible alternative. If an element can't be found by role or label, fix its accessibility first.
- Assert on visible Spanish copy and on navigation (`toHaveURL`), not on implementation details.
- Use Playwright's auto-waiting assertions (`await expect(...).toBeVisible()`). Never use `waitForTimeout`.
- Run with a mobile viewport (375px wide). The app is mobile-first.
- Each test is independent: set up its own mocks and auth state, and never depend on another test's result.
- No `test.only` or `test.skip` committed.
