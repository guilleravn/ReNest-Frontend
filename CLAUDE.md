# ReNest Frontend

React 19 + Vite SPA for ReNest, a secondhand marketplace for LatAm, built with React Router 7, Tailwind 4 and shadcn (base-ui) components. The API is in `../ReNest-Backend`, which also holds the product docs. Fullstack tickets run in one session started in the backend with `--add-dir ../ReNest-Frontend`.

## Commands

- `npm run dev`: app on `http://localhost:5173`.
- `npm run lint` · `npm run build` (includes the type check) · `npm run test:e2e` (Playwright).
- Before every commit: `npm run lint && npm run build && npm run test:e2e`.

## Architecture

- `src/pages/`: one component per route; routes are declared in `src/App.tsx`. Pages fetch data and compose components.
- `src/components/`: shared components with no business logic (`ui/`, `layout/`, `listing/`). The catalog is in `src/components/README.md`, with a live preview at `/ui-kit`.
- `src/lib/`: utilities, the API client, formatters and the Spanish labels for API enums.
- Path alias: `@/` maps to `src/`.

## Conventions

- **UI:** reuse the shared components. Check the catalog before creating one; if a component almost fits, extend it with a prop or variant instead. Update the catalog when you add or change a component.
- **Styling:** use only the design tokens from `src/index.css`, through Tailwind utilities (`bg-surface`, `text-text-muted`, `bg-green-strong`). No hard-coded colors, font sizes, radii or shadows; if a value is missing, add a token. Light mode only.
- Import `cn` from `@/lib/utils`.
- **API:** every request goes through the typed API client in `src/lib/`; components never call `fetch` directly. Request and response shapes follow `../ReNest-Backend/docs/api-contract.md`; routes live under `/api/v1`.
- **Business rules are enforced by the backend.** The frontend mirrors validations for UX only and always handles API errors by their `code` (contract section 8), not by message: for example, `401` sends to login, and `409 LISTING_NOT_AVAILABLE` explains what changed.
- **Every page that loads data has loading, empty and error states, and is mobile-first** (it must work at 375px).
- **Data formatting:**
  - prices arrive in cents and are formatted with the `es` locale;
  - enums arrive in English UPPER_SNAKE (`GENTLY_USED`, `COCHABAMBA_BO`) and are shown with their Spanish label from `src/lib/`. Categories come from the API with their display name.
- **Language:** code, comments, docs and commit messages are in English. User-facing copy is in Spanish.

## Docs: read on demand, only the part you need

- `../ReNest-Backend/docs/business-rules.md`: product rules by ID (`RES-5`). Read the section for the screen you touch.
- `../ReNest-Backend/docs/api-contract.md`: endpoints, payloads and errors.
- `../ReNest-Backend/docs/decisions.md`: why the stack and process are the way they are.
- `src/components/README.md`: the component catalog.
- `.claude/rules/testing.md`: testing standards. Read it before writing tests.

**Keep docs in sync:** if a change alters a component's API, the catalog or a convention, update the doc in the same commit.

## Git workflow

The same block is in both repos; keep them identical.

- `develop` is the integration branch. `main` is production and only receives PRs from `develop`.
- Branch from `origin/develop`, using the name Linear gives the issue (`<user>/ren-45-...`). Use the same name in both repos.
- Commit in small slices. Each commit:
  - does one coherent thing;
  - builds, passes lint and tests, and includes its own tests;
  - never mixes a refactor with a feature.
- Message format: Conventional Commits with a scope, in English and in the imperative mood. A subject of 72 characters or less. Add a `Refs: REN-xx` trailer.

  ```
  feat(reservations): reject reserving your own listing

  Refs: REN-50
  ```
- Review fixes: `git commit --fixup <sha>`. Before merging, rebase on the latest develop with `git rebase --autosquash origin/develop` (Git 2.44+), then `git push --force-with-lease`. Commits like "fix review" or "wip" never reach `develop`.
- PRs target `develop` and are merged with **"Create a merge commit"**. Never squash, which loses the slices, and never "Rebase and merge", which rewrites every hash. Use one PR per repo per ticket, link the two PRs to each other, and put `Closes REN-xx` in the body.
- Never: `--no-verify`, pushing directly to `develop` or `main`, or committing `.env` files.
