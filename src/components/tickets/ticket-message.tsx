import React from 'react'
import type { TicketMessage } from '@/types/tickets'

type TicketMessageProps = Pick<TicketMessage, 'sender' | 'content' | 'created_at'>

export function TicketMessage({ sender, content, created_at }: TicketMessageProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{sender?.full_name || 'Unknown'}</span>
                <span>•</span>
                <sub className="text-muted-foreground">
                    {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </sub>
            </div>
            <div className="pl-0 text-sm">
                {content}
            </div>
        </div>
    )
} 