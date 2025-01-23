import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

export function useReviewerTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    const fetchTickets = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                customer:customers(name),
                assigned:profiles(full_name)
            `)
            .or(`assigned_to.eq.${session.user.id},and(assigned_to.is.null,status.eq.open)`)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setTickets(data as unknown as Ticket[])
        } else {
            console.error('Error fetching tickets:', error)
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchTickets()

        const channel = supabase
            .channel('reviewer-tickets')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                },
                () => fetchTickets()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, fetchTickets])

    const assignTicket = async (ticketId: string) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return false

        const { error } = await supabase
            .from('tickets')
            .update({
                assigned_to: session.user.id,
                status: 'in_progress'
            })
            .eq('id', ticketId)

        if (error) {
            console.error('Error assigning ticket:', error)
            return false
        }

        await fetchTickets()
        return true
    }

    return { tickets, loading, assignTicket }
} 