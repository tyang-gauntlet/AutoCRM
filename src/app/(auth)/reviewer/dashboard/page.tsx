'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    StarIcon,
    MessageCircle,
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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTicketDetails } from '@/hooks/use-ticket-details'
import type { TicketWithDetails } from '@/types/tickets'
import { ReviewerTicketView } from '@/components/tickets/reviewer-ticket-view'
import { AssignedIndicator } from '@/components/tickets/assigned-indicator'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReviewerDashboard() {
    const { tickets, loading, assignTicket } = useReviewerTickets()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [activeTab, setActiveTab] = React.useState<"all" | "assigned">("all")
    const [selectedTickets, setSelectedTickets] = React.useState<string[]>([])
    const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null)

    console.log('[ReviewerDashboard] Render:', {
        hasTickets: !!tickets?.length,
        ticketCount: tickets?.length,
        loading,
        activeTab
    })

    // Get ticket details for the selected ticket
    const { ticket: selectedTicket, messages, sendMessage, updateStatus, updatePriority } = useTicketDetails(
        selectedTicketId || undefined,
        'reviewer'
    )

    // Modify filters to check for unassigned tickets
    const openTickets = tickets.filter(t => t.status === 'open' && !t.assigned_to)
    const inProgressTickets = tickets.filter(t => t.assigned_to)

    const handleAssign = async (ticketId: string) => {
        const success = await assignTicket(ticketId)
        if (!success) {
            console.error('Failed to assign ticket')
        }
    }

    const handleStatusUpdate = async (newStatus: string) => {
        if (!selectedTicketId || !updateStatus) return

        const success = await updateStatus(newStatus)
        if (!success) {
            console.error('Failed to update ticket status')
        }
    }

    const handleUrgentUpdate = async () => {
        if (!selectedTicketId || !updatePriority || !selectedTicket) return

        const success = await updatePriority('urgent')
        if (!success) {
            console.error('Failed to update ticket priority')
        }
    }

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.priority.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeTab === "assigned") {
            return matchesSearch && ticket.assigned_to
        }
        return matchesSearch
    })

    // Transform ticket to match TicketWithDetails type
    const selectedTicketWithDetails: TicketWithDetails | null = selectedTicket ? {
        id: selectedTicket.id,
        title: selectedTicket.title,
        description: selectedTicket.description,
        priority: selectedTicket.priority,
        status: selectedTicket.status,
        created_at: selectedTicket.created_at,
        updated_at: selectedTicket.updated_at,
        customer: selectedTicket.customer ? {
            name: selectedTicket.customer.name || undefined,
            email: selectedTicket.customer?.email || undefined
        } : undefined,
        assigned: selectedTicket.assigned?.full_name ? {
            full_name: selectedTicket.assigned.full_name
        } : undefined,
        creator: selectedTicket.creator?.email ? {
            email: selectedTicket.creator.email
        } : undefined
    } : null

    return (
        <>
            {/* Sidebar with ticket list */}
            <div className="w-[400px] flex flex-col border-r">
                {/* Header with Stats */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-semibold">Tickets</h2>
                        <div className="flex items-center space-x-2">
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 cursor-help">
                                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm font-medium tabular-nums">{openTickets.length}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Open tickets</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 cursor-help">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium tabular-nums">{inProgressTickets.length}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">In progress</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 cursor-help">
                                            <MessageSquare className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm font-medium tabular-nums">{tickets.length}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Total tickets</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    <Link href="/reviewer/feedback">
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MessageCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">View Feedback</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="border-b px-4 py-2">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "assigned")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="all" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                All Tickets
                            </TabsTrigger>
                            <TabsTrigger value="assigned" className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Assigned
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tickets..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tickets List */}
                <div className="flex-1 overflow-auto">
                    <div className="divide-y">
                        {loading ? (
                            <p className="text-sm text-muted-foreground p-4">Loading tickets...</p>
                        ) : filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 hover:bg-muted cursor-pointer",
                                        selectedTickets.includes(ticket.id) && "bg-muted",
                                        selectedTicketId === ticket.id && "bg-muted"
                                    )}
                                    onClick={() => {
                                        setSelectedTicketId(ticket.id)
                                    }}
                                >
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">{ticket.title}</p>
                                            {ticket.assigned_to && (
                                                <AssignedIndicator name={ticket.assigned?.email || undefined} />
                                            )}
                                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                                {ticket.priority}
                                            </Badge>
                                            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                                                {ticket.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="truncate">{ticket.creator?.email || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>{ticket.assigned_to ? 'Updated' : 'Created'} {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground p-4">No tickets found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Ticket detail or placeholder */}
                <div className="flex-1 overflow-auto">
                    {selectedTicketWithDetails ? (
                        <ReviewerTicketView
                            ticket={selectedTicketWithDetails}
                            messages={messages || []}
                            sendMessage={sendMessage}
                            onAssign={selectedTicket && !selectedTicket.assigned_to ? () => handleAssign(selectedTicket.id) : undefined}
                            onStatusUpdate={handleStatusUpdate}
                            onPriorityUpdate={handleUrgentUpdate}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a ticket to view details
                        </div>
                    )}
                </div>
            </div>
        </>
    )
} 