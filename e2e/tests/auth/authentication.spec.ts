import { test as base, expect } from '@playwright/test'

// Create a test fixture for unique credentials
const test = base.extend({
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
    test('should complete signup and auto-login', async ({ page, uniqueCredentials }) => {
        // Create account via API
        const signupResponse = await fetch('http://localhost:54321/auth/v1/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify({
                email: uniqueCredentials.email,
                password: uniqueCredentials.password,
                options: {
                    data: { role: 'user' }
                }
            })
        })

        const signupData = await signupResponse.json()
        if (!signupResponse.ok) {
            throw new Error(`API signup failed: ${JSON.stringify(signupData)}`)
        }

        // Create profile
        const createProfileResponse = await fetch('http://localhost:54321/rest/v1/profiles?on_conflict=id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${signupData.access_token}`,
                'Prefer': 'return=minimal,resolution=merge-duplicates'
            },
            body: JSON.stringify({
                id: signupData.user.id,
                email: uniqueCredentials.email,
                full_name: null,
                role: 'user',
                status: 'active',
                last_sign_in_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        })

        if (!createProfileResponse.ok) {
            throw new Error('Failed to create profile')
        }

        // Test UI login flow with retry
        let retries = 3
        while (retries > 0) {
            try {
                await page.goto('/login')
                await page.waitForLoadState('networkidle')

                await page.getByLabel('Email').fill(uniqueCredentials.email)
                await page.getByLabel('Password').fill(uniqueCredentials.password)

                const [authResponse] = await Promise.all([
                    page.waitForResponse(
                        response => response.url().includes('/auth/v1/token')
                    ),
                    page.getByRole('button', { name: /sign in/i }).click()
                ])

                const authData = await authResponse.json()
                if (!authResponse.ok) throw new Error('Authentication failed')

                await setAuthCookies(page, {
                    access_token: authData.access_token,
                    refresh_token: authData.refresh_token
                })

                // Wait for navigation with timeout
                await Promise.race([
                    page.waitForURL('/user/dashboard', { timeout: 10000 }),
                    page.waitForSelector('text=Welcome', { timeout: 10000 })
                ])
                break
            } catch (e) {
                retries--
                if (retries === 0) throw e
                await page.waitForTimeout(1000)
            }
        }

        await expect(page.getByRole('heading', { name: /welcome/i }))
            .toBeVisible({ timeout: 5000 })
    })

    test('should handle invalid login attempts', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.getByLabel('Email').fill('wrong@example.com')
        await page.getByLabel('Password').fill('wrongpassword')
        await page.getByRole('button', { name: /sign in/i }).click()

        await expect(
            page.getByRole('alert').filter({ hasText: /invalid/i })
        ).toBeVisible({ timeout: 5000 })
    })

    test('should handle logout', async ({ page, uniqueCredentials }) => {
        // First create account via API
        const signupResponse = await fetch('http://localhost:54321/auth/v1/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify({
                email: uniqueCredentials.email,
                password: uniqueCredentials.password,
                options: {
                    data: { role: 'user' }
                }
            })
        })

        const signupData = await signupResponse.json()
        if (!signupResponse.ok) {
            throw new Error(`API signup failed: ${JSON.stringify(signupData)}`)
        }

        // Create profile
        const createProfileResponse = await fetch('http://localhost:54321/rest/v1/profiles?on_conflict=id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${signupData.access_token}`,
                'Prefer': 'return=minimal,resolution=merge-duplicates'
            },
            body: JSON.stringify({
                id: signupData.user.id,
                email: uniqueCredentials.email,
                full_name: null,
                role: 'user',
                status: 'active',
                last_sign_in_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        })

        if (!createProfileResponse.ok) {
            throw new Error('Failed to create profile')
        }

        // Login with retry - modified for Firefox compatibility
        let loginRetries = 3
        while (loginRetries > 0) {
            try {
                await page.goto('/login', { waitUntil: 'networkidle' })

                // Fill form first
                await page.getByLabel('Email').fill(uniqueCredentials.email)
                await page.getByLabel('Password').fill(uniqueCredentials.password)

                // Then click and wait for response
                const responsePromise = page.waitForResponse(
                    response => response.url().includes('/auth/v1/token'),
                    { timeout: 10000 }
                )
                await page.getByRole('button', { name: /sign in/i }).click()
                const authResponse = await responsePromise

                const authData = await authResponse.json()
                if (!authResponse.ok) throw new Error('Authentication failed')

                await setAuthCookies(page, {
                    access_token: authData.access_token,
                    refresh_token: authData.refresh_token
                })

                // Wait for navigation with timeout and verification
                await Promise.race([
                    page.waitForURL('/user/dashboard', { timeout: 10000 }),
                    page.waitForSelector('text=Welcome', { timeout: 10000 })
                ])
                break
            } catch (e) {
                loginRetries--
                if (loginRetries === 0) throw e
                // Use a shorter timeout and check page state
                if (page.isClosed()) {
                    throw new Error('Page was closed unexpectedly')
                }
                await new Promise(resolve => setTimeout(resolve, 500))
            }
        }

        // Handle logout with verification
        const signOutButton = page.locator('button[aria-label="Sign out"]')
        await signOutButton.waitFor({ state: 'visible', timeout: 5000 })

        // Click and wait for navigation with verification
        await Promise.all([
            page.waitForURL('/login', { timeout: 10000 }),
            signOutButton.click(),
            page.waitForSelector('button[type="submit"]', { timeout: 10000 }) // Wait for login button
        ])

        // Verify logout was successful
        await expect(page.getByRole('button', { name: /sign in/i }))
            .toBeVisible({ timeout: 5000 })

        const cookies = await page.context().cookies()
        const authCookies = cookies.filter(cookie =>
            cookie.name.includes('sb-') ||
            cookie.name.includes('supabase')
        )
        expect(authCookies).toHaveLength(0)
    })
}) 