import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './e2e/tests',
    timeout: 30000,
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        timeout: 120000,
        reuseExistingServer: !process.env.CI,
    },
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
}) 