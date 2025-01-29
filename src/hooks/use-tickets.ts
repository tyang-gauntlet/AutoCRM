import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

export function useTickets(priorityFilter?: string) {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                if (!supabase) {
                    throw new Error('Supabase client not initialized')
                }

                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    console.error('No active session')
                    setLoading(false)
                    return
                }

                console.log('Fetching tickets for user:', session.user.id)

                let query = supabase
                    .from('tickets')
                    .select(`
                        *,
                        customer:customers(name),
                        assigned:profiles!tickets_assigned_to_fkey(full_name)
                    `, { count: 'exact' })
                    .order('created_at', { ascending: false })

                if (priorityFilter) {
                    const priorities = priorityFilter.split(',')
                    query = query.in('priority', priorities)
                }

                const { data, error, count } = await query

                if (error) {
                    console.error('Error fetching tickets:', error.message, error.details)
                    setLoading(false)
                    return
                }

                console.log('Tickets query result:', {
                    count,
                    dataLength: data?.length,
                    firstTicket: data?.[0],
                    userId: session.user.id
                })

                setTickets(data as unknown as Ticket[])
            } catch (err) {
                console.error('Unexpected error fetching tickets:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()

        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }
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
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            supabase.removeChannel(channel)
        }
    }, [priorityFilter])

    return { tickets, loading }
} 