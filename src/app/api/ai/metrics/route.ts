import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { LangSmithClient } from 'langsmith'

const langsmith = new LangSmithClient({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { trace_id, ticket_id, type, metrics } = body

        // Record in LangSmith
        await langsmith.updateRun(trace_id, {
            feedback: {
                ...metrics,
                timestamp: new Date().toISOString()
            }
        })

        // Calculate overall score based on metric type
        const score = type === 'kra'
            ? (metrics.accuracy + metrics.relevance_score + metrics.context_match) / 3
            : (metrics.overall_quality + metrics.relevance + metrics.accuracy + metrics.tone) / 20 // Scale 0-5 to 0-1

        // Insert core metric
        const { data: metricData, error: metricError } = await supabase
            .from('ai_metrics')
            .insert({
                trace_id,
                ticket_id,
                type,
                score,
                metadata: metrics,
                created_by: session.user.id
            })
            .select()
            .single()

        if (metricError) throw metricError

        // Insert detailed metrics
        if (type === 'kra') {
            await supabase
                .from('knowledge_retrieval_metrics')
                .insert({
                    metric_id: metricData.id,
                    ...metrics
                })
        } else {
            await supabase
                .from('response_quality_metrics')
                .insert({
                    metric_id: metricData.id,
                    ...metrics
                })
        }

        return NextResponse.json({ success: true, data: metricData })

    } catch (error) {
        console.error('Error recording metrics:', error)
        return NextResponse.json(
            { error: 'Failed to record metrics' },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const ticket_id = searchParams.get('ticket_id')
        const type = searchParams.get('type')
        const timeframe = searchParams.get('timeframe') || '24 hours'

        if (!ticket_id || !type) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            )
        }

        const supabase = createRouteHandlerClient({ cookies })

        const { data, error } = await supabase
            .rpc('get_average_metrics', {
                p_ticket_id: ticket_id,
                p_type: type,
                p_timeframe: timeframe
            })

        if (error) throw error

        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error('Error fetching metrics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        )
    }
} 