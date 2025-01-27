'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name' | 'email'> | null
    assigned: { email: string | null } | null
    creator: { email: string | undefined } | null
}

type CreatorData = {
    id: string
    email: string | null
}

type CreatorMap = {
    [key: string]: string | undefined
}

export function useReviewerTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        async function fetchTickets() {
            try {
                const { data: ticketsData, error: ticketsError } = await supabase
                    .from('tickets')
                    .select(`
                        *,
                        customer:customer_id(
                            name,
                            email
                        ),
                        assigned:profiles!tickets_assigned_to_fkey(
                            email
                        )
                    `)
                    .order('created_at', { ascending: false })

                if (ticketsError) throw ticketsError

                // Get unique creator IDs
                const creatorIds = Array.from(
                    new Set(
                        ticketsData
                            ?.map(t => t.created_by)
                            .filter((id): id is string => id !== null)
                    )
                )

                // Fetch creator emails
                const { data: creatorData } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .in('id', creatorIds)

                // Create creator map
                const creatorMap: CreatorMap = Object.fromEntries(
                    (creatorData as CreatorData[] || []).map(c => [c.id, c.email || undefined])
                )

                // Transform tickets
                const transformedTickets = (ticketsData || []).map(ticket => ({
                    ...ticket,
                    customer: ticket.customer,
                    assigned: ticket.assigned ? { email: ticket.assigned.email } : null,
                    creator: ticket.created_by
                        ? { email: creatorMap[ticket.created_by] }
                        : null
                })) as Ticket[]

                setTickets(transformedTickets)
            } catch (error) {
                console.error('Error fetching tickets:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()
    }, [supabase])

    const assignTicket = async (ticketId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) return false

            const { error } = await supabase
                .from('tickets')
                .update({ assigned_to: session.user.id })
                .eq('id', ticketId)

            return !error
        } catch (error) {
            console.error('Error assigning ticket:', error)
            return false
        }
    }

    return { tickets, loading, assignTicket }
} 