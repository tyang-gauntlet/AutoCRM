import { renderHook, act } from '@testing-library/react'
import { useRole } from '../use-role'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { vi } from 'vitest'

// Mock Supabase client
const mockSupabase = {
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { role: 'admin' }, error: null }))
            }))
        }))
    }))
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: vi.fn(() => mockSupabase)
}))

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
    useAuthContext: () => ({
        user: { id: 'test-user-id' },
        session: { user: { id: 'test-user-id' } },
        loading: false,
        initialized: true,
    })
}))

describe('useRole', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with loading state and null role', () => {
        const { result } = renderHook(() => useRole())
        expect(result.current.loading).toBe(true)
        expect(result.current.role).toBe(null)
    })

    it('should fetch and set user role', async () => {
        const { result } = renderHook(() => useRole())
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })
        expect(result.current.loading).toBe(false)
        expect(result.current.role).toBe('admin')
        expect(result.current.isAdmin).toBe(true)
    })

    it('should handle role fetch error', async () => {
        // Override the mock for this test only
        mockSupabase.from.mockImplementationOnce(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.reject(new Error('Failed to fetch role')))
                }))
            }))
        }))

        const { result } = renderHook(() => useRole())
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.role).toBe('user') // Fallback to user role on error
    })
}) 