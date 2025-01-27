import { middleware } from './middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/auth-helpers-nextjs')
vi.mock('next/server', () => {
    class MockResponse extends Response {
        constructor(body?: BodyInit | null, init?: ResponseInit) {
            super(body, init)
        }
    }

    return {
        NextResponse: {
            next: () => new MockResponse(),
            redirect: (url: string) => new MockResponse(null, {
                status: 302,
                headers: { location: url }
            })
        },
        NextRequest: class extends Request {
            nextUrl: URL
            constructor(input: string | URL) {
                super(input)
                this.nextUrl = new URL(input)
            }
        }
    }
})

// Helper to create mock Supabase client
const createMockSupabase = ({
    user = null,
    role = null,
    error = null
}: {
    user?: { id: string; email: string } | null;
    role?: string | null;
    error?: Error | null;
}) => {
    if (error) {
        console.log('Creating error mock:', error)
        return {
            auth: {
                getSession: vi.fn().mockRejectedValue(error)
            }
        }
    }

    // Create mock profile data
    const profileData = role && user ? {
        id: user.id,
        email: user.email,
        role: role,
        status: 'active',
        full_name: user.email.split('@')[0]
    } : null

    console.log('Creating profile data:', profileData)

    // Create mock query chain for profiles table
    const mockSupabase = {
        auth: {
            getSession: vi.fn().mockImplementation(async () => {
                const sessionData = {
                    data: {
                        session: user ? {
                            user: {
                                ...user,
                                raw_app_meta_data: { provider: 'email', role },
                                app_metadata: { provider: 'email', role },
                                user_metadata: { full_name: user.email.split('@')[0] },
                                aud: 'authenticated',
                                role: 'authenticated',
                                email_confirmed_at: new Date().toISOString()
                            },
                            access_token: 'mock-token',
                            token_type: 'bearer',
                            expires_in: 3600,
                            refresh_token: 'mock-refresh-token',
                            expires_at: Date.now() + 3600000
                        } : null
                    }
                }
                console.log('getSession returning:', sessionData)
                return sessionData
            })
        },
        from: vi.fn().mockImplementation((table) => {
            console.log('from() called with table:', table)
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockImplementation((columns) => {
                        console.log('select() called with:', columns)
                        return {
                            eq: vi.fn().mockImplementation((field, value) => {
                                console.log('eq() called with:', field, value)
                                return {
                                    single: vi.fn().mockImplementation(async () => {
                                        const result = { data: profileData, error: null }
                                        console.log('single() returning:', result)
                                        return result
                                    })
                                }
                            })
                        }
                    })
                }
            }
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: null })
                    })
                })
            }
        })
    }

    return mockSupabase
}

describe('Middleware', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
        vi.clearAllMocks()
        mockRequest = new NextRequest('http://localhost:3000/user/dashboard')
    })

    it('should handle unauthenticated users on protected routes', async () => {
        const mockSupabase = createMockSupabase({ user: null })
        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase as any)

        const response = await middleware(mockRequest)
        expect(response.headers.get('location')).toBe(
            'http://localhost:3000/login?redirect=%2Fuser%2Fdashboard'
        )
    })

    it('should allow authenticated users on protected routes', async () => {
        const mockSupabase = createMockSupabase({
            user: { id: '123', email: 'test@example.com' },
            role: 'user'
        })
        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase as any)

        const response = await middleware(mockRequest)
        expect(response.headers.get('location')).toBeNull()
    })

    it('should allow unauthenticated users on public routes', async () => {
        const publicRequest = new NextRequest('http://localhost:3000/login')
        const mockSupabase = createMockSupabase({ user: null })
        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase as any)

        const response = await middleware(publicRequest)
        expect(response.headers.get('location')).toBeNull()
    })

    it('should redirect authenticated users to role-specific dashboard', async () => {
        // ARRANGE
        const request = new NextRequest('http://localhost:3000/login')

        // Simplified mock that matches our simplified flow
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({
                    data: { session: { user: { id: 'test-id' } } },
                    error: null
                })
            },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: 'admin' }
                        })
                    })
                })
            })
        }

        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase as any)

        // ACT
        const response = await middleware(request)

        // ASSERT
        expect(response.headers.get('location')).toBe('http://localhost:3000/admin/dashboard')
    })

    it('should handle errors gracefully', async () => {
        const request = new NextRequest('http://localhost:3000/user/dashboard')

        // Update error mock to match Supabase's error structure
        const mockError = new Error('Invalid JWT')
        mockError.name = 'AuthApiError'
        mockError.status = 401
        mockError.statusCode = 401

        // Create direct error mock instead of using helper
        const errorSupabase = {
            auth: {
                getSession: vi.fn().mockRejectedValue(mockError)
            }
        }
        vi.mocked(createMiddlewareClient).mockReturnValue(errorSupabase as any)

        // Verify the response
        const response = await middleware(request)
        expect(response.headers.get('location')).toBe(
            'http://localhost:3000/login?redirect=%2Fuser%2Fdashboard'
        )
    })
})

describe('Role-Based Access Control', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should prevent users from accessing admin routes', async () => {
        const request = new NextRequest('http://localhost:3000/admin/dashboard')
        const mockSupabase = createMockSupabase({
            user: { id: 'test-user', email: 'test@example.com' },
            role: 'user'
        })
        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase as any)

        const response = await middleware(request)
        expect(response.headers.get('location')).toBe('http://localhost:3000/user/dashboard')
    })

    it('should allow admins to access admin routes', async () => {
        const request = new NextRequest('http://localhost:3000/admin/dashboard')
        const mockSupabase = createMockSupabase({
            user: { id: 'test-admin', email: 'admin@example.com' },
            role: 'admin'
        })
        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase as any)

        const response = await middleware(request)
        expect(response.headers.get('location')).toBeNull()
    })
}) 