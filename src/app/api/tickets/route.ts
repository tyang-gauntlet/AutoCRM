export const dynamic = 'force-dynamic'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const json = await request.json()
        const { title, description, customer_id, priority = 'medium' } = json

        const { data, error } = await supabase
            .from('tickets')
            .insert({
                title,
                description,
                customer_id,
                priority,
                created_by: session.user.id,
                status: 'open'
            })
            .select('*')
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating ticket:', error)
        return NextResponse.json({ error: 'Error creating ticket' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { searchParams } = new URL(request.url)
        const priorities = searchParams.get('priority')?.split(',') || []

        let query = supabase
            .from('tickets')
            .select(`
                *,
                assigned:assigned_to (
                    id,
                    email,
                    full_name
                )
            `)

        if (priorities.length > 0) {
            query = query.in('priority', priorities)
        }

        const { data: tickets, error } = await query.order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ tickets })
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
} 