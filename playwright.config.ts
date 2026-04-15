import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = 'http://localhost:5173/youtube-ai-chat/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  timeout: isCI ? 60000 : 30000,
  use: {
    actionTimeout: 10000,
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120000,
  },
});
