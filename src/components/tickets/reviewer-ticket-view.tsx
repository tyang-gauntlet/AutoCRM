'use client'

import React from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { priorityColors, statusColors } from '@/constants/ticket'
import type { TicketWithDetails, TicketMessage } from '@/types/tickets'

interface ReviewerTicketViewProps {
    ticket: TicketWithDetails
    messages: TicketMessage[]
    sendMessage: (message: string) => Promise<boolean>
    onAssign?: () => Promise<void>
}

export function ReviewerTicketView({
    ticket,
    messages,
    sendMessage,
    onAssign
}: ReviewerTicketViewProps) {
    const [message, setMessage] = React.useState('')
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        const success = await sendMessage(message)
        if (success) {
            setMessage('')
        }
    }

    const customerIdentifier = ticket.creator?.email || 'No email provided'
    const customerInitial = customerIdentifier.charAt(0).toUpperCase()

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between p-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>
                                {customerInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-lg font-semibold">{ticket.title}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{customerIdentifier}</span>
                                <span>•</span>
                                <span>{new Date(ticket.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge className={priorityColors[ticket.priority]}>
                            {ticket.priority}
                        </Badge>
                        <Badge className={statusColors[ticket.status]}>
                            {ticket.status}
                        </Badge>
                    </div>
                </div>
                {onAssign && !ticket.assigned && (
                    <Button onClick={onAssign}>
                        Assign to Me
                    </Button>
                )}
            </div>

            <Separator />

            {/* Description */}
            <div className="p-4">
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <Separator />

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{message.sender?.email || 'Unknown'}</span>
                            <span>•</span>
                            <span className="text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm pl-0">{message.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage(e)
                            }
                        }}
                    />
                    <Button type="submit" className="self-end">
                        Send
                    </Button>
                </form>
            </div>
        </div>
    )
} 