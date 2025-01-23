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

        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const assigned_to = searchParams.get('assigned_to')

        let query = supabase.from('tickets').select(`
      *,
      customer:customers(id, name, email),
      assigned:profiles(id, full_name),
      creator:profiles(id, full_name)
    `)

        if (status) query = query.eq('status', status)
        if (priority) query = query.eq('priority', priority)
        if (assigned_to) query = query.eq('assigned_to', assigned_to)

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching tickets:', error)
        return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 })
    }
} 