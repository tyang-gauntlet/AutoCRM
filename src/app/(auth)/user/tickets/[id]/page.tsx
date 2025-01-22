'use client'

import { useParams } from 'next/navigation'
import { useTicketDetails } from '@/hooks/use-ticket-details'
import { TicketDetail } from '@/components/tickets/ticket-detail'

export default function UserTicketDetail() {
    const params = useParams<{ id: string }>()
    const { ticket, messages, loading, sendMessage } = useTicketDetails(
        params.id as string,
        'user'
    )

    if (loading || !ticket) {
        return <div>Loading...</div>
    }

    return (
        <TicketDetail
            ticket={ticket}
            messages={messages}
            sendMessage={sendMessage}
        />
    )
} 