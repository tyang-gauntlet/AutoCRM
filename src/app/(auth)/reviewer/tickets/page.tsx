'use client'

import { useReviewerTickets } from '@/hooks/use-reviewer-tickets'
import { TicketList } from '@/components/tickets/ticket-list'

export default function ReviewerTickets() {
    const { tickets, loading } = useReviewerTickets()

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">All Tickets</h1>
            <TicketList
                tickets={tickets}
                baseUrl="/reviewer/tickets"
                isReviewer={true}
            />
        </div>
    )
} 