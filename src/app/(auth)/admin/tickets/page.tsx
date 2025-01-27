'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TicketList } from '@/components/tickets/ticket-list'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        async function fetchTickets() {
            if (!user) return

            try {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error
                setTickets(data || [])
            } catch (error) {
                console.error('Error fetching tickets:', error)
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
            </div>
            <TicketList tickets={tickets} baseUrl="/admin/tickets" />
        </div>
    )
} 