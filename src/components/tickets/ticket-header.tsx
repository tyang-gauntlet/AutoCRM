import React from 'react'
import { Card } from '@/components/ui/card'
import { TicketBadge } from './ticket-badge'
import type { TicketWithDetails } from '@/types/tickets'
import { AssignedIndicator } from './assigned-indicator'

interface TicketHeaderProps {
    ticket: TicketWithDetails
}

export function TicketHeader({ ticket }: TicketHeaderProps) {
    return (
        <Card className="mb-6 p-4 lg:p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="mb-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{ticket.title}</h1>
                                {ticket.assigned && (
                                    <AssignedIndicator name={ticket.assigned.full_name} />
                                )}
                            </div>
                            <div className="flex gap-2">
                                <TicketBadge type="priority" value={ticket.priority} />
                                <TicketBadge type="status" value={ticket.status} />
                            </div>
                        </div>
                        <sub className="text-sm text-muted-foreground">
                            Created {new Date(ticket.created_at).toLocaleString()}
                        </sub>
                    </div>
                    <p className="text-muted-foreground">{ticket.description}</p>
                </div>
                {ticket.assigned && (
                    <div className="text-right ml-4">
                        <p className="text-sm font-medium">Assigned to:</p>
                        <p className="text-sm text-muted-foreground">
                            {ticket.assigned.full_name}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    )
} 