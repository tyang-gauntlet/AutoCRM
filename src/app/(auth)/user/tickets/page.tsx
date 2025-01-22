'use client'

import { useTickets } from '@/hooks/use-tickets'
import { TicketList } from '@/components/tickets/ticket-list'

export default function UserTickets() {
    const { tickets, loading } = useTickets()

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">Your Tickets</h1>
            <TicketList tickets={tickets} baseUrl="/user/tickets" />
        </div>
    )
} 