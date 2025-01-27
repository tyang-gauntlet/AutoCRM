import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../use-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: vi.fn(() => ({
        auth: {
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } }
            }))
        },
        from: vi.fn()
    }))
}))

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useAuth())
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBe(null)
    })

    it('should handle sign in state change', async () => {
        const mockSupabase = {
            auth: {
                signInWithPassword: vi.fn(() => Promise.resolve({
                    data: { session: { user: { id: 'test-id' } } },
                    error: null
                })),
                onAuthStateChange: vi.fn(() => ({
                    data: { subscription: { unsubscribe: vi.fn() } }
                }))
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: { role: 'admin' }, error: null }))
                    }))
                }))
            }))
        }
            ; (createClientComponentClient as jest.Mock).mockImplementationOnce(() => mockSupabase)

        const { result } = renderHook(() => useAuth())

        await act(async () => {
            await result.current.signIn('test@example.com', 'password')
        })

        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
    })

    // Add more tests...
}) 