import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'on',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../backend && bun run src/index.ts',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 15_000,
      env: {
        ADMIN_EMAIL: 'admin@bkskjold.dk',
        ADMIN_PASSWORD: 'test1234',
      },
    },
    {
      command: 'cd ../frontend && bunx vite --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
});
