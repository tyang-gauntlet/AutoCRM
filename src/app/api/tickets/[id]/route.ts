export const dynamic = 'force-dynamic'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: ticket, error } = await supabase
            .from('tickets')
            .select(`
                *,
                assigned:assigned_to (
                    id,
                    email,
                    full_name
                )
            `)
            .eq('id', params.id)
            .single()

        if (error) throw error

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(ticket)
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json(
            { error: 'Error fetching ticket' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const json = await request.json()
        const { status, assigned_to } = json

        // Validate the update data
        if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status value' },
                { status: 400 }
            )
        }

        // Build the update object
        const updateData: { status?: string; assigned_to?: string | null } = {}
        if (status) updateData.status = status
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to

        const { data: ticket, error } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', params.id)
            .select('*')
            .single()

        if (error) throw error

        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(ticket)
    } catch (error) {
        console.error('Error updating ticket:', error)
        return NextResponse.json(
            { error: 'Error updating ticket' },
            { status: 500 }
        )
    }
} 