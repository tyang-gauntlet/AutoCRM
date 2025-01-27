'use client'

import { useReviewerTickets } from '@/hooks/use-reviewer-tickets'
import { TicketList } from '@/components/tickets/ticket-list'
import type { TicketWithDetails } from '@/types/tickets'
import type { TicketPriority, TicketStatus } from '@/constants/ticket'

export default function AssignedTicketsPage() {
    const { tickets, loading } = useReviewerTickets()

    // Transform tickets to match TicketWithDetails type
    const ticketsWithDetails: TicketWithDetails[] = tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority as TicketPriority,
        status: ticket.status as TicketStatus,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        customer: ticket.customer ? {
            name: ticket.customer.name || undefined,
            email: ticket.customer.email || undefined
        } : undefined,
        assigned: ticket.assigned ? {
            full_name: ticket.assigned.email || 'Unknown'
        } : undefined,
        creator: ticket.creator ? {
            email: ticket.creator.email || ''
        } : undefined
    }))

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Assigned Tickets</h1>
            </div>
            <TicketList
                tickets={ticketsWithDetails}
                baseUrl="/reviewer/tickets"
                isReviewer={true}
            />
        </div>
    )
} 