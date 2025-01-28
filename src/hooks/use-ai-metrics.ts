import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AIMetric, MetricsResponse } from '@/types/ai/metrics'

export function useAIMetrics(ticketId?: string) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [kraMetrics, setKraMetrics] = useState<MetricsResponse['data']>()
    const [rgqsMetrics, setRgqsMetrics] = useState<MetricsResponse['data']>()

    const supabase = createClientComponentClient()

    // Fetch metrics for both types
    const fetchMetrics = useCallback(async () => {
        if (!ticketId) return

        setLoading(true)
        setError(null)

        try {
            const [kraResponse, rgqsResponse] = await Promise.all([
                fetch(`/api/ai/metrics?ticket_id=${ticketId}&type=kra`),
                fetch(`/api/ai/metrics?ticket_id=${ticketId}&type=rgqs`)
            ])

            const [kraData, rgqsData] = await Promise.all([
                kraResponse.json(),
                rgqsResponse.json()
            ])

            if (!kraResponse.ok) throw new Error(kraData.error)
            if (!rgqsResponse.ok) throw new Error(rgqsData.error)

            setKraMetrics(kraData.data)
            setRgqsMetrics(rgqsData.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
        } finally {
            setLoading(false)
        }
    }, [ticketId])

    // Record new metrics
    const recordMetrics = useCallback(async (
        type: 'kra' | 'rgqs',
        traceId: string,
        metrics: Record<string, unknown>
    ) => {
        if (!ticketId) return

        try {
            const response = await fetch('/api/ai/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trace_id: traceId,
                    ticket_id: ticketId,
                    type,
                    metrics
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error)

            // Refresh metrics after recording
            await fetchMetrics()
            return data
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to record metrics')
        }
    }, [ticketId, fetchMetrics])

    // Subscribe to realtime updates
    useEffect(() => {
        if (!ticketId) return

        const channel = supabase
            .channel(`metrics:${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ai_metrics',
                    filter: `ticket_id=eq.${ticketId}`
                },
                () => {
                    fetchMetrics()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [ticketId, supabase, fetchMetrics])

    // Initial fetch
    useEffect(() => {
        fetchMetrics()
    }, [fetchMetrics])

    return {
        loading,
        error,
        kraMetrics,
        rgqsMetrics,
        recordMetrics,
        refreshMetrics: fetchMetrics
    }
} 