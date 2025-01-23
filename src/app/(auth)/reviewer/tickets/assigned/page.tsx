'use client'

import { useReviewerTickets } from '@/hooks/use-reviewer-tickets'
import { TicketList } from '@/components/tickets/ticket-list'
import type { TicketWithDetails } from '@/types/tickets'
import type { TicketPriority, TicketStatus } from '@/constants/ticket'

export default function ReviewerAssignedTickets() {
    const { tickets, loading } = useReviewerTickets()

    if (loading) {
        return <div>Loading...</div>
    }

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
            name: ticket.customer.name,
            email: undefined // Add email if available in your data
        } : undefined,
        assigned: ticket.assigned?.full_name ? {
            full_name: ticket.assigned.full_name
        } : undefined
    }))

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">My Assigned Tickets</h1>
            <TicketList
                tickets={ticketsWithDetails}
                baseUrl="/reviewer/tickets"
                isReviewer={true}
            />
        </div>
    )
} 