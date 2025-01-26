import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { waitFor } from '@testing-library/dom'
import { useTicketDetails } from '../use-ticket-details'

// Mock data: IMPORTANT - include "created_by" so the hook fetches creator's email
const mockTicketData = {
    id: 'test-123',
    title: 'Test Ticket',
    status: 'open',
    priority: 'medium',
    customer: { name: 'Test Customer', email: 'test@example.com' },
    assigned: null,
    creator: null,
    created_by: 'creator-xyz'
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: vi.fn(() => {
        // ➊ Utility function: Return an object that supports
        //    .select(), .eq(), .order(), .single(), .insert(), and .update().
        //    We'll handle different table names to simulate different results.
        const createMockQuery = (tableName: string) => {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: tableName === 'tickets'
                        ? mockTicketData
                        : null,
                    error: null
                }),

                // Insert chain: .insert(...).select(...).single()
                insert: vi.fn().mockImplementation((row) => {
                    // Return a chain that has .select(...) => chain => .single() => promise
                    return {
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'msg-123',
                                    content: row.content ?? '',
                                    sender_id: 'user-123', // Hard-coded in test
                                    sender: {
                                        id: 'user-123',
                                        full_name: 'Test User'
                                    }
                                },
                                error: null
                            })
                        })
                    }
                }),

                // Update chain: .update(...).eq(...) => promise
                update: vi.fn().mockImplementation((vals) => {
                    // Return an object with eq(...) => resolved promise
                    return {
                        eq: vi.fn().mockResolvedValue({
                            data: null,
                            error: null
                        })
                    }
                })
            }
        }

        // ➋ The "from" mock checks which table is used, returning a chain for each.
        const fromMock = vi.fn((tableName: string) => {
            return createMockQuery(tableName)
        })

        // ➌ The subscription mocks stay the same.
        const subscription = {
            unsubscribe: vi.fn().mockResolvedValue(undefined)
        }
        const channel = {
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue(subscription),
            unsubscribe: vi.fn().mockResolvedValue(undefined)
        }

        // ➍ The Supabase client mock
        return {
            from: fromMock,

            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: 'user-123' } },
                    error: null
                })
            },

            // ➎ Mock .rpc for get_user_emails. If user_ids includes "creator-xyz," we'll return { email: 'creator@example.com' } so the hook sets ticket.creator properly.
            rpc: vi.fn(async (fnName, args) => {
                if (fnName === 'get_user_emails' && args.user_ids?.includes('creator-xyz')) {
                    return {
                        data: [{ id: 'creator-xyz', email: 'creator@example.com' }],
                        error: null
                    }
                }
                if (fnName === 'get_user_emails' && args.user_ids?.includes('user-123')) {
                    return {
                        data: [{ id: 'user-123', email: 'testuser@example.com' }],
                        error: null
                    }
                }
                return { data: null, error: null }
            }),

            channel: vi.fn().mockReturnValue(channel),
            removeChannel: vi.fn().mockResolvedValue(undefined)
        }
    })
}))

describe('useTicketDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch ticket details successfully', async () => {
        const { result, unmount } = renderHook(() => useTicketDetails('test-123'))
        await act(async () => { /* Let the effect finish */ })
        await waitFor(() => {
            expect(result.current.ticket).toEqual({
                ...mockTicketData,
                creator: { email: 'creator@example.com' } // Because of the .rpc mock
            })
            expect(result.current.loading).toBe(false)
        })
        unmount()
    })

    it('should send message successfully', async () => {
        const { result, unmount } = renderHook(() => useTicketDetails('test-123'))
        await act(async () => {
            const success = await result.current.sendMessage('Test message')
            expect(success).toBe(true)
        })
        unmount()
    })

    it('should update ticket status', async () => {
        const { result, unmount } = renderHook(() => useTicketDetails('test-123', 'reviewer'))
        await act(async () => {
            const success = await result.current.updateStatus?.('in_progress')
            expect(success).toBe(true)
        })
        unmount()
    })
}) 