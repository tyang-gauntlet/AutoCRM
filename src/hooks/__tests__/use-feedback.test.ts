import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedback } from '../use-feedback'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => ({
                        data: { role: 'reviewer' },
                        error: null
                    }))
                })),
                order: vi.fn(() => ({
                    data: [
                        {
                            id: 'feedback-1',
                            rating: 5,
                            created_at: new Date().toISOString(),
                            tickets: {
                                title: 'Test Ticket',
                                customer: { name: 'Test Customer', company: 'Test Co' },
                                creator: { full_name: 'Test Creator' }
                            }
                        }
                    ],
                    error: null
                }))
            }))
        })),
        auth: {
            getSession: vi.fn(() => ({
                data: { session: { user: { id: 'user-123' } } },
                error: null
            }))
        }
    }))
}))

describe('useFeedback', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch feedback data successfully', async () => {
        const { result } = renderHook(() => useFeedback())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(result.current.feedback).toHaveLength(1)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('should calculate stats correctly', async () => {
        const { result } = renderHook(() => useFeedback())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0))
        })

        expect(result.current.stats.averageRating).toBe(5)
        expect(result.current.stats.totalFeedback).toBe(1)
    })
}) 