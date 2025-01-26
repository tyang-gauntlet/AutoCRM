import { test, expect } from '@playwright/test'

test('auth operations performance', async ({ page }) => {
    const start = Date.now()
    await page.goto('/login')
    // Test implementation
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
}) 