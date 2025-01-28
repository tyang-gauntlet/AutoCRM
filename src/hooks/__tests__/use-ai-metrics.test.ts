import { renderHook, waitFor } from '@testing-library/react'
import { useAIMetrics } from '../use-ai-metrics'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { vi, expect, describe, it, beforeEach } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: vi.fn()
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('useAIMetrics', () => {
    const mockSupabase = {
        channel: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        removeChannel: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    it('fetches metrics on mount', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: { avg_score: 0.85, count: 2 } })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: { avg_score: 0.78, count: 1 } })
            })

        const { result } = renderHook(() => useAIMetrics('test-123'))

        await waitFor(() => {
            expect(result.current.kraMetrics).toBeDefined()
            expect(result.current.rgqsMetrics).toBeDefined()
        })

        expect(result.current.kraMetrics?.avg_score).toBe(0.85)
        expect(result.current.rgqsMetrics?.avg_score).toBe(0.78)
    })

    it('handles errors correctly', async () => {
        mockFetch.mockRejectedValueOnce(new Error('API Error'))

        const { result } = renderHook(() => useAIMetrics('test-123'))

        await waitFor(() => {
            expect(result.current.error).toBe('API Error')
        })
    })

    it('records new metrics successfully', async () => {
        const expectedRequestBody = {
            trace_id: 'trace-123',
            ticket_id: 'test-123',
            type: 'kra',
            metrics: {
                accuracy: 0.9,
                relevance_score: 0.85,
                context_match: 0.8
            }
        }

        // Mock all possible fetch calls
        mockFetch
            // Initial KRA metrics fetch
            .mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: null })
            }))
            // Initial RGQS metrics fetch
            .mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: null })
            }))
            // Record metrics call
            .mockImplementationOnce((url, options) => {
                expect(JSON.parse(options.body)).toEqual(expectedRequestBody)
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: {
                            id: 'new-metric',
                            ...expectedRequestBody
                        }
                    })
                })
            })
            // Refresh KRA metrics after recording
            .mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: { avg_score: 0.85, count: 3 } })
            }))
            // Refresh RGQS metrics after recording
            .mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: { avg_score: 0.78, count: 1 } })
            }))

        const { result } = renderHook(() => useAIMetrics('test-123'))

        // Wait for initial hook setup
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        // Call recordMetrics
        const response = await result.current.recordMetrics('kra', 'trace-123', {
            accuracy: 0.9,
            relevance_score: 0.85,
            context_match: 0.8
        })

        expect(response).toBeDefined()
        expect(response.data.id).toBe('new-metric')

        // Verify fetch was called correctly for the metrics recording
        expect(mockFetch).toHaveBeenCalledWith('/api/ai/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.any(String)
        })

        // Verify total number of calls (2 initial + 1 record + 2 refresh)
        expect(mockFetch).toHaveBeenCalledTimes(5)

        // Verify the metrics were refreshed
        await waitFor(() => {
            expect(result.current.kraMetrics?.count).toBe(3)
        })
    })
}) 