'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'

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
    const { user, profile } = useAuth()  // Get auth context

    useEffect(() => {
        // Don't fetch if we don't have user or profile yet
        if (!user || !profile) {
            console.log('[useReviewerTickets] Waiting for auth...', {
                hasUser: !!user,
                hasProfile: !!profile
            })
            return
        }

        // Verify reviewer role
        if (profile.role !== 'reviewer') {
            console.error('[useReviewerTickets] User is not a reviewer:', profile.role)
            return
        }

        async function fetchTickets() {
            try {
                console.log('[useReviewerTickets] Fetching tickets...')

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

                if (ticketsError) {
                    console.error('[useReviewerTickets] Error fetching tickets:', ticketsError)
                    throw ticketsError
                }

                console.log('[useReviewerTickets] Tickets fetched:', {
                    count: ticketsData?.length,
                    firstTicket: ticketsData?.[0]
                })

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
                console.error('[useReviewerTickets] Error:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()

        // Set up realtime subscription
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
    }, [supabase, user, profile]) // Add user and profile as dependencies

    const assignTicket = async (ticketId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                console.error('[useReviewerTickets] No session for assign')
                return false
            }

            const { error } = await supabase
                .from('tickets')
                .update({
                    assigned_to: session.user.id,
                    status: 'in_progress'  // Update status when assigned
                })
                .eq('id', ticketId)

            if (error) {
                console.error('[useReviewerTickets] Error assigning ticket:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('[useReviewerTickets] Error:', error)
            return false
        }
    }

    return { tickets, loading, assignTicket }
} 