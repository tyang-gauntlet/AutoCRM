import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

export function useTickets(priorityFilter?: string) {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        const fetchTickets = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            let query = supabase
                .from('tickets')
                .select(`
                    *,
                    customer:customers(name),
                    assigned:profiles!tickets_assigned_to_fkey(full_name)
                `)
                .order('created_at', { ascending: false })

            // If priority filter is provided, apply it
            if (priorityFilter) {
                const priorities = priorityFilter.split(',')
                query = query.in('priority', priorities)
            }

            const { data, error } = await query

            if (!error && data) {
                setTickets(data as unknown as Ticket[])
            } else {
                console.error('Error fetching tickets:', error)
            }
            setLoading(false)
        }

        fetchTickets()

        const channel = supabase
            .channel('tickets')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets'
                },
                () => fetchTickets()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, priorityFilter])

    return { tickets, loading }
} 