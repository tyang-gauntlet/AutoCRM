'use client'

import { useEffect, useState } from 'react'
import type { Database } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customers: Pick<Database['public']['Tables']['customers']['Row'], 'id' | 'name' | 'email' | 'company'> | null
    creator: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'email' | 'full_name' | 'role'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'email' | 'full_name' | 'role'> | null
}

export function useReviewerTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const { user, profile } = useAuth()

    useEffect(() => {
        if (!user || !profile || profile.role !== 'reviewer') {
            console.log('[useReviewerTickets] Not a reviewer or no auth:', {
                hasUser: !!user,
                userRole: profile?.role
            })
            return
        }

        async function fetchTickets() {
            try {
                // Add null checks for TypeScript
                if (!user || !profile) {
                    console.log('[useReviewerTickets] User or profile is null')
                    return
                }

                console.log('[useReviewerTickets] Fetching tickets for reviewer:', {
                    userId: user.id,
                    userRole: profile.role,
                    timestamp: new Date().toISOString()
                })

                // Query with detailed logging
                const query = supabase
                    .from('tickets')
                    .select(`
                        *,
                        customers:customers(
                            id,
                            name,
                            email,
                            company
                        ),
                        creator:profiles!tickets_created_by_fkey(
                            id,
                            email,
                            full_name,
                            role
                        ),
                        assigned:profiles!tickets_assigned_to_fkey(
                            id,
                            email,
                            full_name,
                            role
                        )
                    `)
                    .order('created_at', { ascending: false })

                console.log('[useReviewerTickets] Running query with updated foreign key syntax')

                const { data: ticketsData, error: ticketsError } = await query

                if (ticketsError) {
                    console.error('[useReviewerTickets] Query error:', ticketsError)
                    throw ticketsError
                }

                console.log('[useReviewerTickets] Raw query result:', {
                    error: ticketsError,
                    data: ticketsData,
                    count: ticketsData?.length ?? 0
                })

                setTickets(ticketsData || [])
            } catch (error) {
                console.error('[useReviewerTickets] Error:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTickets()

        // Set up realtime subscription
        const channel = supabase
            .channel('reviewer_tickets')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tickets',
                filter: `status=open,assigned_to=eq.${user.id}`
            }, () => fetchTickets())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, user, profile])

    const assignTicket = async (ticketId: string) => {
        if (!user) return false

        try {
            const { error } = await supabase
                .from('tickets')
                .update({
                    assigned_to: user.id,
                    status: 'in_progress'
                })
                .eq('id', ticketId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('[useReviewerTickets] Error assigning ticket:', error)
            return false
        }
    }

    return { tickets, loading, assignTicket }
} 