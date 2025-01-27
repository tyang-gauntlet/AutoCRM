'use client'

import React from 'react'
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
import type { TicketWithDetails } from '@/types/tickets'

export default function ReviewerTicketPage() {
    const { id } = useParams() as { id: string }
    const { ticket, messages, loading, sendMessage, updateStatus, assignToMe } = useTicketDetails(id, 'reviewer')

    if (loading || !ticket) {
        return <div>Loading...</div>
    }

    // Transform ticket to match TicketWithDetails type
    const ticketWithDetails: TicketWithDetails = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
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
            ticket={ticketWithDetails}
            messages={messages}
            sendMessage={sendMessage}
            isReviewer={true}
            reviewerControls={reviewerControls}
        />
    )
} 