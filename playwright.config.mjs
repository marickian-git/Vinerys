import { defineConfig, devices } from '@playwright/test';

// E2E rulează pe o bază de date separată (docker-compose.dev.yml → Postgres pe 5433), niciodată pe producție.
const PORT = 3200;
const DATABASE_URL = process.env.E2E_DATABASE_URL || 'postgresql://vinerys_user:vinerys_pass@localhost:5433/vinerys_dev';

if (/casa-spiridus/.test(DATABASE_URL)) throw new Error('E2E nu rulează pe baza de date de producție');

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'ro-RO',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // NEXT_PUBLIC_* se aplică la build, deci build-ul se face cu aceleași variabile
    command: process.env.E2E_SKIP_BUILD ? `npx next start -p ${PORT}` : `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/crama/health`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL,
      BASE_URL: '/crama',
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}/crama`,
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-123',
      AI_CREDENTIALS_SECRET: 'e2e-ai-secret',
      MINIO_ENDPOINT: 'localhost',
      MINIO_PORT: '9000',
      MINIO_ACCESS_KEY: 'e2e',
      MINIO_SECRET_KEY: 'e2e-secret',
      SMTP_HOST: '',
    },
  },
});
