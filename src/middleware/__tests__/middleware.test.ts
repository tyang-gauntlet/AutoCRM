import { middleware } from './middleware'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

vi.mock('@supabase/auth-helpers-nextjs')

describe('Auth Middleware', () => {
    const mockCreateClient = createMiddlewareClient as jest.Mock
    const mockSupabase = {
        auth: {
            getSession: vi.fn()
        },
        from: vi.fn()
    }

    // Setup chained mock functions
    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    const mockSingle = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()

        // Reset chain mocks
        mockSelect.mockReturnValue({ eq: mockEq })
        mockEq.mockReturnValue({ single: mockSingle })
        mockSupabase.from.mockReturnValue({ select: mockSelect })

        mockCreateClient.mockReturnValue(mockSupabase)
    })

    it('should redirect unauthenticated users to login', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

        const request = new NextRequest(new URL('http://localhost/admin/dashboard'))
        const response = await middleware(request)

        expect(response?.status).toBe(307)
        expect(response?.headers.get('location')).toBe('http://localhost/login')
    })

    it('should allow unauthenticated users to access public routes', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

        const request = new NextRequest(new URL('http://localhost/login'))
        const response = await middleware(request)

        expect(response?.status).not.toBe(307)
    })

    it('should redirect authenticated users on public routes to their dashboard', async () => {
        // Mock session
        mockSupabase.auth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'test-id' }
                }
            },
            error: null
        })

        // Mock role query
        mockSingle.mockResolvedValue({
            data: { role: 'admin' },
            error: null
        })

        const request = new NextRequest(new URL('http://localhost/login'))
        const response = await middleware(request)

        expect(response?.status).toBe(307)
        expect(response?.headers.get('location')).toBe('http://localhost/admin/dashboard')
    })

    it('should enforce role-based access', async () => {
        // Mock session
        mockSupabase.auth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'test-id' }
                }
            },
            error: null
        })

        // Mock role query
        mockSingle.mockResolvedValue({
            data: { role: 'user' },
            error: null
        })

        const request = new NextRequest(new URL('http://localhost/admin/dashboard'))
        const response = await middleware(request)

        expect(response?.status).toBe(307)
        expect(response?.headers.get('location')).toBe('http://localhost/user/dashboard')
    })

    it('should handle database errors gracefully', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'test-id' } } },
            error: null
        })
        mockSupabase.from().select().eq().single.mockRejectedValue(new Error('Database error'))

        const request = new NextRequest(new URL('http://localhost/admin/dashboard'))
        const response = await middleware(request)

        expect(response?.status).toBe(307)
        expect(response?.headers.get('location')).toBe('http://localhost/login')
    })

    it('should handle role changes correctly', async () => {
        // Test that middleware updates access when role changes
    })

    it('should handle concurrent requests correctly', async () => {
        // Test middleware behavior with multiple simultaneous requests
    })

    it('should respect role hierarchy', async () => {
        // Test that admin can access lower role routes
        // Test that lower roles cannot access higher role routes
    })
}) 