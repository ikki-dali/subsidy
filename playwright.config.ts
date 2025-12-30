import { defineConfig, devices } from '@playwright/test';

/**
 * 補助金ナビ E2E テスト設定
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // レート制限を避けるため直列実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 1ワーカーで直列実行
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* ローカルdevサーバーを自動起動 */
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

