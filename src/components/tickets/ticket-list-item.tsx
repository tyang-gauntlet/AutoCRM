import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TicketBadge } from './ticket-badge'
import type { TicketWithDetails } from '@/types/tickets'
import { Badge } from '@/components/ui/badge'
import { priorityColors, statusColors } from '@/constants/ticket'
import { AssignedIndicator } from './assigned-indicator'

interface TicketListItemProps {
    ticket: TicketWithDetails
    href: string
    showAssignment?: boolean
    actions?: React.ReactNode
}

export function TicketListItem({ ticket, href, showAssignment, actions }: TicketListItemProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href={href} className="hover:underline font-medium">
                        {ticket.title}
                    </Link>
                    {showAssignment && ticket.assigned && (
                        <AssignedIndicator name={ticket.assigned.full_name} />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                    </Badge>
                    <Badge className={statusColors[ticket.status]}>
                        {ticket.status}
                    </Badge>
                </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.description}
            </p>
            <div className="flex gap-2">
                {actions}
                <Button variant="outline" size="sm" asChild>
                    <Link href={href}>View</Link>
                </Button>
            </div>
        </div>
    )
} 