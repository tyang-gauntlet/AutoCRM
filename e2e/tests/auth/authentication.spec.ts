import { test as base, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Test credentials
const TEST_USER = {
    email: 'test@example.com',
    password: 'testpassword123'
}

// Create extended test with fixtures
const extendedTest = base.extend({
    // Add any fixtures here if needed
})

// Helper function to set auth cookies
async function setAuthCookies(page: any, tokens: { access_token: string, refresh_token: string }) {
    await page.context().addCookies([
        {
            name: 'sb-access-token',
            value: tokens.access_token,
            domain: 'localhost',
            path: '/',
        },
        {
            name: 'sb-refresh-token',
            value: tokens.refresh_token,
            domain: 'localhost',
            path: '/',
        }
    ])
}

extendedTest.describe('Authentication Flow', () => {
    extendedTest.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    extendedTest('should redirect to login when accessing protected route', async ({ page }) => {
        await page.goto('/user/dashboard')
        await expect(page).toHaveURL('/login')
    })

    extendedTest('should handle signup validation', async ({ page }) => {
        await page.goto('/signup')
        await page.waitForLoadState('networkidle')

        await page.fill('[data-testid="signup-email"]', TEST_USER.email)
        await page.fill('[data-testid="signup-password"]', TEST_USER.password)
        await page.click('[data-testid="signup-submit"]')

        await expect(
            page.locator('[data-testid="signup-submit"]')
        ).toHaveText(/Signing up\.\.\./, { timeout: 5000 })
    })

    extendedTest('should handle invalid login attempts', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.fill('[data-testid="email"]', 'wrong@example.com')
        await page.fill('[data-testid="password"]', 'wrongpassword')
        await page.click('[data-testid="login-button"]')

        await expect(
            page.locator('[data-testid="login-error"]')
        ).toBeVisible({ timeout: 15000 })

        const errorText = await page.locator('[data-testid="login-error"]').textContent()
        expect(errorText).toContain('Invalid login credentials')
    })

    extendedTest('should handle login flow', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.fill('[data-testid="email"]', TEST_USER.email)
        await page.fill('[data-testid="password"]', TEST_USER.password)

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('[data-testid="login-button"]')
        ])

        await expect(page).toHaveURL(/.*dashboard/)
        await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 30000 })
    })

    extendedTest('should allow login and profile creation', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.fill('[data-testid="email"]', TEST_USER.email)
        await page.fill('[data-testid="password"]', TEST_USER.password)

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('[data-testid="login-button"]')
        ])

        await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 })
        await page.waitForLoadState('networkidle')

        const logoutButton = page.locator('[data-testid="logout-button"]')
        await expect(logoutButton).toBeVisible({ timeout: 30000 })
    })
})

export { extendedTest as test } 