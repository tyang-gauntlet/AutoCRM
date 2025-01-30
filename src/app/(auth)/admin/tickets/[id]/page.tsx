'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Clock,
    UserCog,
    ArrowLeft,
    AlertCircle,
    ChevronDown,
    Check,
    Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface Ticket {
    id: string
    title: string
    priority: 'high' | 'medium' | 'low' | 'urgent'
    status: 'open' | 'in_progress' | 'resolved'
    created_at: string
    assigned_to?: string
    description: string
    customer_id?: string
    created_by?: string
    assigned?: { email: string }
    ai_handled?: boolean
    ai_metadata?: any
    context_used?: any
    updated_at?: string
}

interface User {
    id: string
    email: string
}

const TICKET_STATUSES = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
]

interface PageProps {
    params: {
        id: string
    }
}

export default function TicketDetails({ params }: PageProps) {
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const { user } = useAuth()

    useEffect(() => {
        const fetchTicket = async () => {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*, assigned:profiles!tickets_assigned_to_fkey(email)')
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                setTicket(data as Ticket)
                setError(null)
            } catch (error) {
                console.error('Error fetching ticket:', error)
                setError('Failed to fetch ticket details')
            } finally {
                setLoading(false)
            }
        }

        const fetchUsers = async () => {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, email')

                if (error) throw error
                setUsers(data as User[])
            } catch (error) {
                console.error('Error fetching users:', error)
            }
        }

        fetchTicket()
        fetchUsers()
    }, [params.id, user])

    const handleStatusUpdate = async (newStatus: string) => {
        if (!user || !ticket) return

        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status: newStatus })
                .eq('id', ticket.id)

            if (error) throw error

            setTicket(prev => prev ? { ...prev, status: newStatus as Ticket['status'] } : null)
        } catch (error) {
            console.error('Error updating ticket status:', error)
            setError('Failed to update status')
        }
    }

    const handleAssign = async (userId: string) => {
        if (!user || !ticket) return

        try {
            const { error } = await supabase
                .from('tickets')
                .update({ assigned_to: userId })
                .eq('id', ticket.id)

            if (error) throw error

            // Refresh ticket data to get updated assigned user info
            const { data: updatedTicket, error: fetchError } = await supabase
                .from('tickets')
                .select('*, assigned:profiles!tickets_assigned_to_fkey(email)')
                .eq('id', ticket.id)
                .single()

            if (fetchError) throw fetchError
            setTicket(updatedTicket as Ticket)
        } catch (error) {
            console.error('Error assigning ticket:', error)
            setError('Failed to assign ticket')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !ticket) {
        return (
            <div className="p-8">
                <Link href="/admin/tickets" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tickets
                </Link>
                <Card className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg font-medium">
                        {error || "Ticket not found"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {error ? (
                            <button
                                onClick={() => window.location.reload()}
                                className="hover:underline"
                            >
                                Try again
                            </button>
                        ) : (
                            "The ticket you're looking for doesn't exist or has been deleted."
                        )}
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <main className="p-8">
            <Link href="/admin/tickets" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8">
                <ArrowLeft className="h-4 w-4" />
                Back to Tickets
            </Link>

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">
                            {ticket.title}
                        </h2>
                        <div className="flex gap-2">
                            <Badge
                                variant={
                                    ticket.priority === 'high' || ticket.priority === 'urgent' ? 'destructive' :
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
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <UserCog className="h-4 w-4" />
                                    Assign
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                                {users.map((user) => (
                                    <DropdownMenuItem
                                        key={user.id}
                                        className="flex items-center justify-between"
                                        onClick={() => handleAssign(user.id)}
                                    >
                                        {user.email}
                                        {ticket.assigned_to === user.id && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="gap-2">
                                    Update Status
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {TICKET_STATUSES.map((status) => (
                                    <DropdownMenuItem
                                        key={status.value}
                                        className="flex items-center justify-between"
                                        onClick={() => handleStatusUpdate(status.value)}
                                    >
                                        {status.label}
                                        {ticket.status === status.value && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                        {ticket.description}
                    </p>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Ticket Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Created {ticket.created_at ? formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }) : 'recently'}</span>
                            </div>
                            {ticket.assigned_to && (
                                <div className="flex items-center gap-2 text-sm">
                                    <UserCog className="h-4 w-4 text-muted-foreground" />
                                    <span>Assigned to {ticket.assigned?.email || 'Unknown user'}</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Customer Information</h3>
                        <div className="space-y-4">
                            {ticket.customer_id ? (
                                <p className="text-sm text-muted-foreground">
                                    Customer ID: {ticket.customer_id}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No customer information available
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </main>
    )
} 