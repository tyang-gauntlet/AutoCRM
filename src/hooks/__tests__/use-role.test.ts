import { renderHook, act } from '@testing-library/react'
import { useRole } from '../use-role'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: vi.fn()
}))

describe('useRole', () => {
    let mockSupabase: any

    beforeEach(() => {
        mockSupabase = {
            auth: {
                getSession: vi.fn()
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn()
                    }))
                }))
            }))
        }
        vi.mocked(createClientComponentClient).mockReturnValue(mockSupabase)
    })

    it('should initialize with loading state and null role', () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
        const { result } = renderHook(() => useRole())
        expect(result.current.loading).toBe(true)
        expect(result.current.role).toBe(null)
    })

    it('should handle no session', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
        const { result } = renderHook(() => useRole())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.role).toBe(null)
    })

    it('should handle role fetch error', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: '123' } } }
        })
        mockSupabase.from().select().eq().single.mockRejectedValue(new Error('Fetch error'))

        const { result } = renderHook(() => useRole())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.role).toBe(null)
    })
}) 