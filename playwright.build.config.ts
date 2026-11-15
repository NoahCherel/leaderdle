import { defineConfig, devices } from '@playwright/test';

// Tests the production build (run `npm run build` first) on a plain static server.
const PORT = 4181;

export default defineConfig({
  testDir: 'tests/build',
  timeout: 30_000,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}`, serviceWorkers: 'allow' },
  webServer: { command: `node scripts/static-server.mjs ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: false },
});
