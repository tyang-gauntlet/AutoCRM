'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    AlertCircle,
    Clock,
    UserCog,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Ticket {
    id: string
    title: string
    priority: 'high' | 'medium' | 'low'
    status: 'open' | 'in_progress' | 'resolved'
    created_at: string
    assigned_to?: string
    description: string
}

export default function AdminTickets() {
    const searchParams = useSearchParams()
    const priorityFilter = searchParams.get('priority')?.split(',') || []
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await fetch('/api/tickets')
                const data = await response.json()
                let filteredTickets = data.tickets

                if (priorityFilter.length > 0) {
                    filteredTickets = filteredTickets.filter(
                        (ticket: Ticket) => priorityFilter.includes(ticket.priority)
                    )
                }

                setTickets(filteredTickets)
            } catch (error) {
                console.error('Error fetching tickets:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()
    }, [priorityFilter])

    if (loading) {
        return <div className="p-8">Loading tickets...</div>
    }

    const priorityLabel = priorityFilter.length > 0
        ? `${priorityFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' & ')} Priority`
        : 'All'

    return (
        <main className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {priorityLabel} Tickets
                    </h2>
                    <p className="text-muted-foreground">
                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {tickets.map((ticket) => (
                    <Card key={ticket.id} className="p-6">
                        <div className="flex items-start gap-4">
                            <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold">{ticket.title}</h3>
                                    <div className="flex gap-2">
                                        <Badge
                                            variant={
                                                ticket.priority === 'high' ? 'destructive' :
                                                    ticket.priority === 'medium' ? 'default' :
                                                        'secondary'
                                            }
                                        >
                                            {ticket.priority}
                                        </Badge>
                                        <Badge
                                            variant={
                                                ticket.status === 'resolved' ? 'default' :
                                                    ticket.status === 'in_progress' ? 'secondary' :
                                                        'outline'
                                            }
                                        >
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {ticket.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>Created {ticket.created_at ? formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }) : 'recently'}</span>
                                    </div>
                                    {ticket.assigned_to && (
                                        <div className="flex items-center gap-1">
                                            <UserCog className="h-4 w-4" />
                                            <span>Assigned to {ticket.assigned_to}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Link href={`/admin/tickets/${ticket.id}`}>
                                <Button variant="outline" size="sm">View Details</Button>
                            </Link>
                        </div>
                    </Card>
                ))}

                {tickets.length === 0 && (
                    <Card className="p-6 text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-lg font-medium">No tickets found</p>
                        <p className="text-sm text-muted-foreground">
                            {priorityFilter.length > 0
                                ? `There are no ${priorityFilter.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')} priority tickets at the moment.`
                                : 'There are no tickets in the system.'}
                        </p>
                    </Card>
                )}
            </div>
        </main>
    )
} 