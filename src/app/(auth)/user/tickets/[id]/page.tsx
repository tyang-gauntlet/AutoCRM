'use client'

import { useParams } from 'next/navigation'
import { useTicketDetails } from '@/hooks/use-ticket-details'
import { TicketDetail } from '@/components/tickets/ticket-detail'
import type { TicketWithDetails } from '@/types/tickets'
import type { TicketPriority, TicketStatus } from '@/constants/ticket'

export default function UserTicketDetail() {
    const params = useParams<{ id: string }>()
    const { ticket, messages, loading, sendMessage } = useTicketDetails(params.id as string, 'user')

    if (loading || !ticket) {
        return <div>Loading...</div>
    }

    // Transform ticket to match TicketWithDetails type
    const ticketWithDetails: TicketWithDetails = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority as TicketPriority,
        status: ticket.status as TicketStatus,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        customer: ticket.customer ? {
            name: ticket.customer.name,
            email: undefined // Add email if available in your data
        } : undefined,
        assigned: ticket.assigned?.full_name ? {
            full_name: ticket.assigned.full_name
        } : undefined
    }

    return (
        <TicketDetail
            ticket={ticketWithDetails}
            messages={messages}
            sendMessage={sendMessage}
        />
    )
} 