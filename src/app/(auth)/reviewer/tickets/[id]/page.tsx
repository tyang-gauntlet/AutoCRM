'use client'

import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useTicketDetails } from '@/hooks/use-ticket-details'
import { TicketDetail } from '@/components/tickets/ticket-detail'

export default function ReviewerTicketDetail() {
    const params = useParams<{ id: string }>()
    const { ticket, messages, loading, sendMessage, updateStatus, assignToMe } = useTicketDetails(
        params.id as string,
        'reviewer'
    )

    if (loading || !ticket) {
        return <div>Loading...</div>
    }

    const reviewerControls = (
        <>
            {!ticket.assigned_to && (
                <Button onClick={assignToMe}>
                    Assign to Me
                </Button>
            )}
            <Select
                value={ticket.status}
                onValueChange={updateStatus}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>
        </>
    )

    return (
        <TicketDetail
            ticket={ticket}
            messages={messages}
            sendMessage={sendMessage}
            isReviewer={true}
            reviewerControls={reviewerControls}
        />
    )
} 