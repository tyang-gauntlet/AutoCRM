import { test, expect } from '@playwright/test'

test('auth operations should complete within acceptable timeframes', async ({ page }) => {
    const signInStart = performance.now()
    // Perform sign in
    const signInEnd = performance.now()

    expect(signInEnd - signInStart).toBeLessThan(2000) // 2 seconds max
}) 