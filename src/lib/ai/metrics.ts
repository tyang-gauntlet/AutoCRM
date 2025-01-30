import { Client } from 'langsmith'
import { supabase } from '@/lib/supabase'
import { KRAMetrics, RGQSMetrics } from './agent-interfaces'

const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY
})

export async function recordKRAMetrics(
    traceId: string,
    ticketId: string | null,
    metrics: KRAMetrics
): Promise<void> {
    try {
        // Record metrics in Supabase
        await supabase.from('ai_metrics').insert({
            trace_id: traceId,
            ticket_id: ticketId,
            type: 'kra',
            score: metrics.accuracy,
            kra_metrics: metrics
        })

        // Record in LangSmith
        await langsmith.createRun({
            name: 'knowledge_retrieval',
            run_type: 'chain',
            id: traceId,
            inputs: { query: metrics.query_text },
            outputs: {
                chunks: metrics.retrieved_chunks,
                relevant: metrics.relevant_chunks,
                accuracy: metrics.accuracy,
                relevance: metrics.relevance_score,
                context_match: metrics.context_match
            },
            start_time: Date.now(),
            end_time: Date.now(),
            extra: { tags: ['kra', ticketId || 'no_ticket'] }
        })
    } catch (error) {
        console.error('Error recording KRA metrics:', error)
    }
}

export async function recordRGQSMetrics(
    traceId: string,
    ticketId: string | null,
    metrics: RGQSMetrics
): Promise<void> {
    try {
        // Record metrics in Supabase
        await supabase.from('ai_metrics').insert({
            trace_id: traceId,
            ticket_id: ticketId,
            type: 'rgqs',
            score: metrics.overall_quality,
            rgqs_metrics: metrics
        })

        // Record in LangSmith
        await langsmith.createRun({
            name: 'response_quality',
            run_type: 'chain',
            id: traceId,
            inputs: { response: metrics.response_text },
            outputs: {
                overall_quality: metrics.overall_quality,
                relevance: metrics.relevance,
                accuracy: metrics.accuracy,
                tone: metrics.tone
            },
            start_time: Date.now(),
            end_time: Date.now(),
            extra: { tags: ['rgqs', ticketId || 'no_ticket'] }
        })
    } catch (error) {
        console.error('Error recording RGQS metrics:', error)
    }
}

export async function recordToolMetrics(
    traceId: string,
    ticketId: string | null,
    toolName: string,
    success: boolean,
    duration: number,
    error?: string
): Promise<void> {
    try {
        const now = Date.now()
        // Record in LangSmith
        await langsmith.createRun({
            name: 'tool_execution',
            run_type: 'tool',
            id: `${traceId}_${toolName}`,
            inputs: { tool: toolName },
            outputs: {
                success,
                duration,
                error: error || null
            },
            start_time: now - duration,
            end_time: now,
            extra: { tags: ['tool', toolName, ticketId || 'no_ticket'] }
        })
    } catch (error) {
        console.error('Error recording tool metrics:', error)
    }
} 
