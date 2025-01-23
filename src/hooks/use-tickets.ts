import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

export function useTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        const fetchTickets = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    customer:customers(name),
                    assigned:profiles!tickets_assigned_to_fkey(full_name)
                `)
                .eq('created_by', session.user.id)
                .order('created_at', { ascending: false })

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
                    table: 'tickets',
                    filter: `created_by=eq.${supabase.auth.getUser()}`
                },
                () => fetchTickets()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return { tickets, loading }
} 