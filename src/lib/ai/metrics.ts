import { Client } from 'langsmith'
import { supabase } from '@/lib/supabase'
import { KRAMetrics, RGQSMetrics } from './agent-interfaces'
import { v4 as uuidv4 } from 'uuid'

const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY
})

// Helper to generate valid UUIDs for LangSmith
function generateRunId(prefix: string): string {
    return uuidv4()
}

export async function recordKRAMetrics(
    ticketId: string | null,
    metrics: KRAMetrics | null
): Promise<void> {
    if (!metrics) {
        console.log('No KRA metrics to record')
        return
    }

    try {
        const runId = generateRunId('kra')

        // Record in LangSmith
        await langsmith.createRun({
            name: 'knowledge_retrieval',
            run_type: 'chain',
            id: runId,
            start_time: new Date().getTime(),
            end_time: new Date().getTime(),
            inputs: {
                query: metrics.query_text || '',
                ticket_id: ticketId
            },
            outputs: {
                retrieved_chunks: metrics.retrieved_chunks || 0,
                relevant_chunks: metrics.relevant_chunks || 0,
                accuracy: metrics.accuracy || 0,
                relevance_score: metrics.relevance_score || 0,
                context_match: metrics.context_match || 0
            },
            error: undefined,
            extra: {
                ticket_id: ticketId,
                metrics_type: 'kra'
            }
        })

        // Record in Supabase
        await supabase.from('ai_metrics').insert({
            trace_id: runId,
            ticket_id: ticketId,
            type: 'kra',
            score: metrics.accuracy || 0,
            metadata: metrics,
            created_at: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error recording KRA metrics:', error)
        // Don't throw - metrics recording should not break the main flow
    }
}

export async function recordRGQSMetrics(
    ticketId: string | null,
    metrics: RGQSMetrics | null
): Promise<void> {
    if (!metrics) {
        console.log('No RGQS metrics to record')
        return
    }

    try {
        const runId = generateRunId('rgqs')

        // Record in LangSmith
        await langsmith.createRun({
            name: 'response_quality',
            run_type: 'chain',
            id: runId,
            start_time: new Date().getTime(),
            end_time: new Date().getTime(),
            inputs: {
                response: metrics.response_text || '',
                ticket_id: ticketId
            },
            outputs: {
                overall_quality: metrics.overall_quality || 0,
                relevance: metrics.relevance || 0,
                accuracy: metrics.accuracy || 0,
                tone: metrics.tone || 0
            },
            error: undefined,
            extra: {
                ticket_id: ticketId,
                metrics_type: 'rgqs'
            }
        })

        // Record in Supabase
        await supabase.from('ai_metrics').insert({
            trace_id: runId,
            ticket_id: ticketId,
            type: 'rgqs',
            score: metrics ?
                (metrics.overall_quality + metrics.relevance + metrics.accuracy + metrics.tone) / 4 :
                0,
            metadata: metrics,
            created_at: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error recording RGQS metrics:', error)
        // Don't throw - metrics recording should not break the main flow
    }
}

export async function recordToolMetrics(
    toolName: string,
    ticketId: string | null,
    success: boolean,
    duration: number,
    error?: string
): Promise<void> {
    try {
        const runId = generateRunId('tool')
        const now = new Date().getTime()

        // Record in LangSmith
        await langsmith.createRun({
            name: toolName,
            run_type: 'tool',
            id: runId,
            start_time: now - duration,
            end_time: now,
            inputs: {
                tool: toolName,
                ticket_id: ticketId
            },
            outputs: {
                success,
                duration
            },
            error: error || undefined,
            extra: {
                ticket_id: ticketId,
                metrics_type: 'tool'
            }
        })

        // Record in Supabase
        await supabase.from('ai_metrics').insert({
            trace_id: runId,
            ticket_id: ticketId,
            type: 'tool',
            score: success ? 1 : 0,
            metadata: {
                tool: toolName,
                duration,
                error: error || undefined
            },
            created_at: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error recording tool metrics:', error)
        // Don't throw - metrics recording should not break the main flow
    }
} 
