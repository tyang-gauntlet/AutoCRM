'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useTicketDetails } from '@/hooks/use-ticket-details'
import { UserTicketView } from '@/components/tickets/user-ticket-view'
import type { TicketWithDetails } from '@/types/tickets'
import type { TicketPriority, TicketStatus } from '@/constants/ticket'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database'

export default function UserTicketDetail() {
    const { id } = useParams() as { id: string }
    const { ticket, messages, loading, sendMessage } = useTicketDetails(id, 'user')
    const supabase = createClientComponentClient<Database>()
    const { toast } = useToast()

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
            name: ticket.customer.name
        } : undefined,
        assigned: ticket.assigned?.full_name ? {
            full_name: ticket.assigned.full_name
        } : undefined
    }

    const handleFeedbackSubmit = async (feedback: { rating: number; comment: string }) => {
        try {
            const { error } = await supabase
                .from('ticket_feedback')
                .insert({
                    ticket_id: ticket.id,
                    rating: feedback.rating,
                    comment: feedback.comment
                })

            if (error) throw error

            toast({
                title: "Feedback submitted",
                description: "Thank you for your feedback!",
            })
        } catch (error) {
            console.error('Error submitting feedback:', error)
            toast({
                title: "Error",
                description: "Failed to submit feedback. Please try again.",
                variant: "destructive",
            })
        }
    }

    return (
        <UserTicketView
            ticket={ticketWithDetails}
            messages={messages}
            sendMessage={sendMessage}
            onSubmitFeedback={handleFeedbackSubmit}
        />
    )
} 