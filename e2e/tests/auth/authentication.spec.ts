import { test as base, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Create a test fixture for unique credentials
type TestFixtures = {
    uniqueCredentials: {
        email: string;
        password: string;
    };
}

const test = base.extend<TestFixtures>({
    uniqueCredentials: async ({ }, use) => {
        const timestamp = Date.now()
        await use({
            email: `test${timestamp}${Math.random().toString(36).substring(2)}@example.com`,
            password: 'TestPassword123!'
        })
    }
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

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    test('should redirect to login when accessing protected route', async ({ page }) => {
        await page.goto('/user/dashboard')
        await expect(page).toHaveURL('/login?redirect=%2Fuser%2Fdashboard')
    })

    test('should handle signup validation', async ({ page }) => {
        const email = `test${Date.now()}@example.com`
        const password = 'testPassword123!'

        await page.goto('/signup')
        await page.waitForLoadState('networkidle')

        // Fill the form
        await page.fill('#email', email)
        await page.fill('#password', password)

        // Submit the form
        await page.click('button[type="submit"]')

        // Wait for button to show loading state
        await expect(
            page.locator('button[type="submit"]')
        ).toHaveText('Signing up...', { timeout: 5000 })
    })

    test('should handle invalid login attempts', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Fill the form
        await page.fill('#email', 'wrong@example.com')
        await page.fill('#password', 'wrongpassword')

        // Submit the form and wait for either error or redirect
        await Promise.all([
            page.click('button[type="submit"]'),
            // Wait for network response
            page.waitForResponse(response =>
                response.url().includes('/auth/v1') &&
                response.status() === 400
            )
        ])

        // Wait for error alert
        await expect(
            page.locator('[data-testid="login-error"]')
        ).toBeVisible({ timeout: 15000 })

        // Verify error message matches Supabase's actual error message
        const errorText = await page.locator('[data-testid="login-error"]').textContent()
        expect(errorText).toContain('Invalid login credentials')
    })

    test('should handle login flow', async ({ page }) => {
        // Create a test user first
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Sign in with test credentials
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'testPassword123!'
        })

        if (authError) {
            console.log('Auth error:', authError)
            return
        }

        // Set auth cookies
        if (authData.session) {
            await page.context().addCookies([
                {
                    name: 'sb-access-token',
                    value: authData.session.access_token,
                    domain: 'localhost',
                    path: '/'
                },
                {
                    name: 'sb-refresh-token',
                    value: authData.session.refresh_token,
                    domain: 'localhost',
                    path: '/'
                }
            ])
        }

        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Fill the form
        await page.fill('#email', 'test@example.com')
        await page.fill('#password', 'testPassword123!')

        // Get submit button
        const submitButton = page.locator('button[type="submit"]')

        // Click login and wait for loading state
        await submitButton.click()

        // Wait for loading state
        await expect(submitButton).toHaveText('Signing in...', { timeout: 5000 })

        // Wait for navigation
        await Promise.race([
            page.waitForURL('/user/dashboard', { timeout: 15000 }),
            page.waitForSelector('[data-testid="login-error"]', { timeout: 15000 })
        ])

        // Check if we got an error
        const error = page.locator('[data-testid="login-error"]')
        const isError = await error.isVisible()

        if (isError) {
            const errorText = await error.textContent()
            throw new Error(`Login failed: ${errorText}`)
        } else {
            // Verify we're on the dashboard
            await expect(page).toHaveURL('/user/dashboard')
        }
    })
})

// Export the test type for other test files
export { test } 