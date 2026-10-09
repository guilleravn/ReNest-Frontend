import { defineConfig, devices } from '@playwright/test'

// Runs the specs in tests/real against the real backend (test database) and
// the real frontend, with no mocks. Needs `npm run db:up` in the backend.
// It uses its own ports (API 3100, app 5174), so it can run next to the dev servers.
// The seed loads the categories a listing needs; it is idempotent.
// storage-init only creates the dev bucket, so it is rerun here to create the
// test bucket the seed uploads its photos to (a no-op when it exists).
const backendCommand = [
  'cd ../ReNest-Backend',
  'set -a && . ./.env && set +a',
  'export DATABASE_URL="$DATABASE_URL_TEST" S3_BUCKET="$S3_BUCKET_TEST" NODE_ENV=test PORT=3100',
  'export AUTH_LOGIN_LIMIT=5 AUTH_LOGIN_WINDOW=1m AUTH_REGISTER_LIMIT=1000',
  'docker compose run --rm -e BUCKET="$S3_BUCKET" storage-init',
  'npx prisma migrate deploy',
  'npm run seed',
  'npx nest start',
].join(' && ')

export default defineConfig({
  testDir: './tests/real',
  // One worker and no parallelism: the specs share one backend and its
  // per-IP rate limit counters.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: 'html',
  outputDir: 'test-results-real',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: backendCommand,
      url: 'http://localhost:3100/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'API_PROXY_TARGET=http://localhost:3100 npm run dev -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
    },
  ],
})
