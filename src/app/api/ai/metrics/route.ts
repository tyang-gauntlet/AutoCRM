import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Client } from 'langsmith'
import { Database } from '@/types/database'

const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
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
            ...metrics,
            timestamp: new Date().toISOString()
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
                .from('ai_metrics')
                .insert({
                    metric_id: metricData.id,
                    ...metrics
                })

        } else {
            await supabase
                .from('ai_metrics')
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

type MetricAggregate = {
    count: number
    total_score: number
    avg_score: number
}

type MetricAggregates = Record<string, MetricAggregate>

export async function GET(request: Request) {
    try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const ticketId = searchParams.get('ticketId')
        const type = searchParams.get('type')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Build query
        let query = supabase.from('ai_metrics').select('*')

        if (ticketId) {
            query = query.eq('ticket_id', ticketId)
        }
        if (type) {
            query = query.eq('type', type)
        }
        if (from) {
            query = query.gte('created_at', from)
        }
        if (to) {
            query = query.lte('created_at', to)
        }

        // Execute query
        const { data: metrics, error } = await query

        if (error) {
            throw error
        }

        // Calculate aggregates
        const aggregates = (metrics || []).reduce((acc: MetricAggregates, metric) => {
            const metricType = metric.type
            if (!acc[metricType]) {
                acc[metricType] = {
                    count: 0,
                    total_score: 0,
                    avg_score: 0
                }
            }
            acc[metricType].count++
            acc[metricType].total_score += metric.score
            acc[metricType].avg_score = acc[metricType].total_score / acc[metricType].count
            return acc
        }, {})

        return NextResponse.json({
            metrics,
            aggregates
        })
    } catch (error) {
        console.error('Error getting metrics:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 