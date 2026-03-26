import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5272',
    headless: true,
  },
  webServer: [
    {
      command: '../server.py',
      port: 5273,
      reuseExistingServer: true,
    },
    {
      command: 'pnpm dev',
      port: 5272,
      reuseExistingServer: true,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
