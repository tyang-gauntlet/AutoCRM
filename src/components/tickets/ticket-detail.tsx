'use client'

import React, { useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { TicketWithDetails, TicketMessage } from '@/types/tickets'
import { TicketHeader } from './ticket-header'
import { TicketMessage as TicketMessageComponent } from './ticket-message'
import { TicketMessageInput } from './ticket-message-input'

interface TicketDetailProps {
    ticket: TicketWithDetails
    messages: TicketMessage[]
    sendMessage: (message: string) => Promise<boolean>
    isReviewer?: boolean
    reviewerControls?: React.ReactNode
}

export function TicketDetail({
    ticket,
    messages,
    sendMessage,
    isReviewer,
    reviewerControls
}: TicketDetailProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <div className="container mx-auto p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
            <TicketHeader ticket={ticket} />

            {/* Messages */}
            <Card className="flex flex-col h-[calc(100vh-20rem)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No messages yet. Start the conversation by sending a message below.
                        </div>
                    ) : (
                        messages.map((message) => (
                            <TicketMessageComponent
                                key={message.id}
                                sender={message.sender}
                                content={message.content}
                                created_at={message.created_at}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <Separator className="my-0" />

                {/* Message Input */}
                <div className="p-4 lg:p-6">
                    <TicketMessageInput
                        onSend={sendMessage}
                        disabled={ticket.status === 'closed'}
                    />
                </div>
            </Card>

            {/* Reviewer Controls */}
            {isReviewer && reviewerControls && (
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
                    <div className="container mx-auto p-4 flex justify-end gap-4">
                        {reviewerControls}
                    </div>
                </div>
            )}
        </div>
    )
} 