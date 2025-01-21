'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTicketDetails } from '@/hooks/use-ticket-details'

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
} as const

const statusColors = {
    open: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
    closed: 'bg-red-100 text-red-800'
} as const

export default function TicketDetail() {
    const params = useParams<{ id: string }>()
    const [message, setMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { ticket, messages, loading, sendMessage } = useTicketDetails(
        params.id as string,
        'user'
    )

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const isTicketClosed = ticket?.status === 'closed'

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isTicketClosed) return

        const success = await sendMessage(message)
        if (success) {
            setMessage('')
        }
    }

    if (loading || !ticket) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
            {/* Ticket Header */}
            <Card className="mb-6 p-4 lg:p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
                        <div className="flex gap-2 mb-2">
                            <Badge className={priorityColors[ticket.priority as TicketPriority]}>
                                {ticket.priority}
                            </Badge>
                            <Badge className={statusColors[ticket.status as TicketStatus]}>
                                {ticket.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Created {new Date(ticket.created_at).toLocaleString()}
                        </p>
                    </div>
                    {ticket.assigned && (
                        <div className="text-right">
                            <p className="text-sm font-medium">Assigned to:</p>
                            <p className="text-sm text-muted-foreground">
                                {ticket.assigned.full_name}
                            </p>
                        </div>
                    )}
                </div>
                <p className="text-muted-foreground">{ticket.description}</p>
            </Card>

            {/* Messages */}
            <Card className="flex flex-col h-[calc(100vh-20rem)]">
                <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.sender_id === ticket.created_by ? 'items-end' : 'items-start'
                                }`}
                        >
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender_id === ticket.created_by
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">
                                        {msg.sender?.full_name || 'Unknown'}
                                    </span>
                                    <span className="text-xs opacity-70">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <p className="break-words">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <Separator className="my-0" />

                {/* Message Input */}
                <div className="p-4 lg:p-6">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={isTicketClosed ? "This ticket is closed" : "Type your message..."}
                            className="flex-1 min-h-[80px]"
                            disabled={isTicketClosed}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !isTicketClosed) {
                                    e.preventDefault()
                                    handleSendMessage(e)
                                }
                            }}
                        />
                        <Button type="submit" className="self-end" disabled={isTicketClosed}>
                            Send
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
} 