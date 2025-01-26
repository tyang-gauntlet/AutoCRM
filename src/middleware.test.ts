import { middleware } from './middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createMiddlewareClient: vi.fn()
}))

// Helper to mock auth with specific role
const mockAuthWithRole = (role: string) => {
    (createMiddlewareClient as jest.Mock).mockReturnValue({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: {
                    session: {
                        user: { id: 'test-user', email: 'test@example.com' }
                    }
                },
                error: null
            })
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => ({
                        data: { role },
                        error: null
                    }))
                }))
            }))
        }))
    })
}

describe('Middleware', () => {
    const mockRequest = new NextRequest('http://localhost:3000/protected')  // Use a non-public route

    beforeEach(() => {
        vi.clearAllMocks()
            ; (createMiddlewareClient as jest.Mock).mockReturnValue({
                auth: {
                    getSession: vi.fn().mockResolvedValue({
                        data: { session: null },
                        error: null
                    })
                },
                from: vi.fn(() => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn(() => ({
                                data: { role: 'user' },
                                error: null
                            }))
                        }))
                    }))
                }))
            })
    })

    it('should handle unauthenticated users on protected routes', async () => {
        const response = await middleware(mockRequest)
        expect(response instanceof Response).toBe(true)
        const location = response.headers.get('location')
        expect(location).toBe('http://localhost:3000/login')
    })

    it('should allow unauthenticated users on public routes', async () => {
        const publicRequest = new NextRequest('http://localhost:3000/login')
        const response = await middleware(publicRequest)
        expect(response.headers.get('location')).toBeNull()
    })

    it('should redirect authenticated users to role-specific dashboard', async () => {
        const mockSession = {
            user: { id: 'test-user', email: 'test@example.com' }
        }
            ; (createMiddlewareClient as jest.Mock).mockReturnValue({
                auth: {
                    getSession: vi.fn().mockResolvedValue({
                        data: { session: mockSession },
                        error: null
                    })
                },
                from: vi.fn(() => ({
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn(() => ({
                                data: { role: 'admin' },
                                error: null
                            }))
                        }))
                    }))
                }))
            })

        const request = new NextRequest('http://localhost:3000/login')  // Public route
        const response = await middleware(request)
        const location = response.headers.get('location')
        expect(location).toBe('http://localhost:3000/admin/dashboard')
    })

    it('should handle errors gracefully', async () => {
        // Mock an error in getSession
        ; (createMiddlewareClient as jest.Mock).mockReturnValue({
            auth: {
                getSession: vi.fn().mockRejectedValue(new Error('Auth error'))
            }
        })

        const response = await middleware(mockRequest)
        expect(response instanceof Response).toBe(true)
        const location = response.headers.get('location')
        expect(location).toBe('http://localhost:3000/login')
    })
})

describe('Role-Based Access Control', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should prevent users from accessing admin routes', async () => {
        mockAuthWithRole('user')
        const request = new NextRequest('http://localhost:3000/admin/dashboard')
        const response = await middleware(request)
        expect(response.headers.get('location')).toBe('http://localhost:3000/user/dashboard')
    })

    it('should allow admins to access admin routes', async () => {
        mockAuthWithRole('admin')
        const request = new NextRequest('http://localhost:3000/admin/dashboard')
        const response = await middleware(request)
        // Admin should be allowed to access admin routes
        expect(response instanceof NextResponse).toBe(true)
        expect(response.headers.get('location')).toBeNull()
    })
}) 