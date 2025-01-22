'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import type { TicketWithDetails } from '@/types/tickets'
import { priorityColors, statusColors } from '@/constants/ticket'
import { TicketListItem } from './ticket-list-item'

interface TicketListProps {
    tickets: TicketWithDetails[]
    baseUrl: string
    isReviewer?: boolean
}

export function TicketList({ tickets, baseUrl, isReviewer }: TicketListProps) {
    return (
        <div className="space-y-4">
            {tickets.map((ticket) => (
                <Card key={ticket.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <TicketListItem
                        ticket={ticket}
                        href={`${baseUrl}/${ticket.id}`}
                        showAssignment={isReviewer}
                    />
                </Card>
            ))}
            {tickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No tickets found
                </div>
            )}
        </div>
    )
} 