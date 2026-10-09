# ReNest Frontend

Web app for ReNest, a secondhand marketplace for LatAm where buyers reserve an item together with a pickup slot and both sides confirm the handover. A mobile-first SPA built with React, Vite, React Router, Tailwind and shadcn. The UI is in Spanish.

Backend and product docs: [ReNest-Backend](https://github.com/guilleravn/ReNest-Backend). Work tracking: Linear project "ReNest MVP R1".

## Documentation

| Doc | What it holds |
|---|---|
| [Business rules](../ReNest-Backend/docs/business-rules.md) | Product rules by ID (`RES-5`), PRD deviations, metrics |
| [API contract](../ReNest-Backend/docs/api-contract.md) | Endpoints, payloads and errors |
| [Decisions](../ReNest-Backend/docs/decisions.md) | Technical and process decisions, with their reasons |
| [src/components/README.md](src/components/README.md) | Shared component catalog (live at `/ui-kit`) |
| [CLAUDE.md](CLAUDE.md) | Conventions and git workflow (read by humans and Claude) |

The links to the backend docs assume both repos are cloned side by side.

## Requirements

- Node.js 22
- The backend running locally (see its README)

## Setup

```bash
npm install
npx playwright install chromium
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment

No `.env` is needed for local development: the app calls `/api/v1` and the Vite dev server proxies `/api` to the backend at `http://localhost:3000`. To point at another API, set `VITE_API_URL` (for example `https://api.example.com/api/v1`) in `.env.local`. See [.env.example](.env.example).

## Deployment

| Piece | URL |
|---|---|
| Frontend (Vercel) | https://re-nest-frontend.vercel.app |
| API (Railway) | https://renest-backend-production.up.railway.app |

Set this variable in the Vercel project (Settings → Environment Variables). Vite reads it at build time, so redeploy after changing it:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://renest-backend-production.up.railway.app/api/v1` |

The API only accepts requests from the frontend origin (`CORS_ORIGIN` in the backend). If you add another domain, such as a preview, add it there too. `vercel.json` rewrites every route to `index.html` so client-side routes such as `/login` do not 404.

## Scripts

| Script | Purpose |
|---|---|
| `dev` | Run the app with hot reload |
| `build` | Type-check and build for production |
| `preview` | Serve the production build |
| `lint` | Lint with oxlint |
| `test:e2e` | Playwright tests with a mocked API (starts the dev server automatically) |
| `test:e2e:real` | Playwright tests against the real stack (see below) |

### Real-stack tests

`tests/real/` runs against the real backend and database, with no mocks. It includes the end-to-end happy path (`e2e-happy-path.spec.ts`): one test follows a seller and another follows a buyer through publishing, reserving, the handover, the reception and the rating.

1. In `../ReNest-Backend`, run `npm run db:up` and make sure its `.env` sets `DATABASE_URL_TEST` and `S3_BUCKET_TEST`.
2. Here, run `npm run test:e2e:real`.

The config starts its own backend on `:3100` (migrations and seed against the test database) and its own app on `:5174`, so it can run alongside the dev servers. Each run uses new accounts, so nothing needs cleaning between runs.

## Contributing

- Branches start from `develop`, and PRs target `develop`. `main` is production and only receives PRs from `develop` (see D-10 in the backend [decisions](../ReNest-Backend/docs/decisions.md)).
- One Linear ticket per branch, using the branch name Linear provides.
- Commits are small slices in Conventional Commits format, with a `Refs: REN-xx` trailer. Full workflow in [CLAUDE.md](CLAUDE.md#git-workflow).
- PRs use the template and are merged with **"Create a merge commit"**, never squash or rebase (see D-9 in the backend [decisions](../ReNest-Backend/docs/decisions.md)).
- Reuse the shared components and design tokens. Update the component catalog when you change a component.

## Working with Claude Code

The setup and daily workflow are described in the [backend README](../ReNest-Backend/README.md#working-with-claude-code). Fullstack sessions start in the backend with `claude --add-dir ../ReNest-Frontend`. That session picks up this repo's `CLAUDE.md`, rules and skills, provided the one-time setup there is done.

For frontend-only work you can also start Claude here. Note that `/ticket` lives in the backend repo, so it is only available when the backend is added (`claude --add-dir ../ReNest-Backend`).

What's configured in this repo:

| File | Purpose | Loaded |
|---|---|---|
| `CLAUDE.md` | Commands, architecture, conventions, git workflow | Every session |
| `.claude/rules/testing.md` | Playwright standards | Only when test files are touched |
| `.claude/settings.json` | Shared permissions (a convenience, not a security boundary; see the backend README) | Only in sessions started here |
| `.mcp.json` | Linear MCP server | Only in sessions started here |
