'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function closeTicket(ticketId: string, reason: string) {
    // Get current user from cookie
    const cookieStore = cookies()
    const token = cookieStore.get('sb-access-token')?.value

    if (!token) throw new Error('Unauthorized')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    // Start a transaction
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

    if (ticketError) throw ticketError
    if (!ticket) throw new Error('Ticket not found')

    // Verify user has permission
    if (ticket.customer_id !== user.id) throw new Error('Unauthorized')

    // Update ticket status
    const { error: updateError } = await supabase
        .from('tickets')
        .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: user.id,
            closed_reason: reason
        })
        .eq('id', ticketId)

    if (updateError) throw updateError

    // Add closure message
    const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            content: `Ticket closed: ${reason}`,
            type: 'system'
        })

    if (messageError) throw messageError

    // Revalidate related pages
    revalidatePath('/user/tickets')
    revalidatePath(`/user/tickets/${ticketId}`)

    return { success: true }
} 