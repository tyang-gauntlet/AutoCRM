import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketBadge } from './ticket-badge'
import type { TicketWithDetails } from '@/types/tickets'

interface TicketListItemProps {
    ticket: TicketWithDetails
    href: string
    showAssignment?: boolean
    actions?: React.ReactNode
}

export function TicketListItem({ ticket, href, showAssignment, actions }: TicketListItemProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium">{ticket.title}</p>
                    <div className="flex gap-2">
                        <TicketBadge type="priority" value={ticket.priority} />
                        <TicketBadge type="status" value={ticket.status} />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {showAssignment && ticket.assigned ? (
                        <span>Assigned to: {ticket.assigned.full_name}</span>
                    ) : (
                        `Updated ${new Date(ticket.updated_at).toLocaleDateString()}`
                    )}
                </p>
            </div>
            <div className="flex gap-2">
                {actions}
                <Button variant="outline" size="sm" asChild>
                    <Link href={href}>View</Link>
                </Button>
            </div>
        </div>
    )
} 