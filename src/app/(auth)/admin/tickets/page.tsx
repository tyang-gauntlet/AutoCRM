'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

interface Ticket {
    id: string
    title: string
    status: 'open' | 'in_progress' | 'resolved'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    created_at: string
    customer_id?: string
    ai_handled?: boolean
    ai_metadata?: any
    context_used?: any
    updated_at?: string
    assigned_to?: string
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    useEffect(() => {
        async function fetchTickets() {
            if (!user) return

            if (!supabase) {
                setError('Supabase client not initialized')
                return
            }

            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error
                setTickets((data || []) as Ticket[])
                setError(null)
            } catch (error) {
                console.error('Error fetching tickets:', error)
                setError('Failed to fetch tickets')
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()
    }, [user])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 p-10">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Customer</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell>
                                    <Link
                                        href={`/admin/tickets/${ticket.id}`}
                                        className="hover:underline"
                                    >
                                        {ticket.title}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            ticket.status === 'resolved' ? 'default' :
                                                ticket.status === 'in_progress' ? 'secondary' :
                                                    'outline'
                                        }
                                    >
                                        {ticket.status?.replace('_', ' ') || 'unknown'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            ticket.priority === 'urgent' ? 'destructive' :
                                                ticket.priority === 'high' ? 'destructive' :
                                                    ticket.priority === 'medium' ? 'default' :
                                                        'secondary'
                                        }
                                    >
                                        {ticket.priority || 'unknown'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {ticket.created_at ? (
                                        formatDistanceToNow(new Date(ticket.created_at), {
                                            addSuffix: true
                                        })
                                    ) : (
                                        'unknown'
                                    )}
                                </TableCell>
                                <TableCell>
                                    {ticket.customer_id || 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {tickets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No tickets found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 