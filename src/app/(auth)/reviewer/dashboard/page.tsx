'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useReviewerTickets } from '@/hooks/use-reviewer-tickets'
import { Badge } from '@/components/ui/badge'
import { priorityColors, statusColors } from '@/constants/ticket'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ReviewerDashboard() {
    const { tickets, loading, assignTicket } = useReviewerTickets()

    // Modify filters to check for unassigned tickets
    const openTickets = tickets.filter(t => t.status === 'open' && !t.assigned_to)
    const inProgressTickets = tickets.filter(t => t.assigned_to)

    const handleAssign = async (ticketId: string) => {
        const success = await assignTicket(ticketId)
        if (!success) {
            // You might want to show an error toast here
            console.error('Failed to assign ticket')
        }
    }

    return (
        <main className="p-8">
            {/* Welcome Section with inline Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Ticket Review Dashboard</h2>

                <div className="flex flex-wrap gap-6 mt-4 md:mt-0">
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    <span className="text-lg font-medium tabular-nums">{openTickets.length}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Open tickets</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="text-lg font-medium tabular-nums">{inProgressTickets.length}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">In progress</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-lg font-medium tabular-nums">2.5h</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Average response time</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                    <MessageSquare className="h-4 w-4 text-purple-500" />
                                    <span className="text-lg font-medium tabular-nums">{tickets.length}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Active tickets</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Tickets Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Unassigned Tickets */}
                <Card className="md:col-span-2">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Unassigned Tickets</h3>
                            <Button variant="ghost" className="gap-2" asChild>
                                <Link href="/reviewer/tickets">
                                    View All <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">Loading tickets...</p>
                            ) : openTickets.length > 0 ? (
                                openTickets.map((ticket) => (
                                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{ticket.title}</p>
                                                <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                                    {ticket.priority}
                                                </Badge>
                                                <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                                                    {ticket.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Created {new Date(ticket.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAssign(ticket.id)}
                                            >
                                                Assign to Me
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/reviewer/tickets/${ticket.id}`}>View</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No unassigned tickets</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* My Assigned Tickets */}
                <Card className="md:col-span-2">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">My Assigned Tickets</h3>
                            <Button variant="ghost" className="gap-2" asChild>
                                <Link href="/reviewer/tickets/assigned">
                                    View All <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">Loading tickets...</p>
                            ) : inProgressTickets.length > 0 ? (
                                inProgressTickets.map((ticket) => (
                                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{ticket.title}</p>
                                                <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Updated {new Date(ticket.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/reviewer/tickets/${ticket.id}`}>Continue</Link>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No assigned tickets</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </main>
    )
} 