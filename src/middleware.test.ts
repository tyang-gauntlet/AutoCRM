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
    let mockSupabase: any

    beforeEach(() => {
        mockRequest = {
            nextUrl: {
                pathname: '/user/dashboard',
                searchParams: new URLSearchParams(),
                href: 'http://localhost:3000/user/dashboard'
            },
            url: 'http://localhost:3000/user/dashboard'
        } as unknown as NextRequest

        mockSupabase = {
            auth: {
                getSession: vi.fn()
            }
        }

        vi.mocked(createMiddlewareClient).mockReturnValue(mockSupabase)
    })

    it('should handle unauthenticated users on protected routes', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })

        const response = await middleware(mockRequest)
        expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    })

    it('should handle errors gracefully', async () => {
        mockSupabase.auth.getSession.mockRejectedValue(new Error('Auth error'))

        const response = await middleware(mockRequest)
        expect(response.headers.get('location')).toBe('http://localhost:3000/login')
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