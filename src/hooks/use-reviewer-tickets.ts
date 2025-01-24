import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name' | 'email'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
    creator: Pick<Database['public']['Tables']['profiles']['Row'], 'email'> | null
}

export function useReviewerTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    const fetchTickets = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Get user's profile to check role
        const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        const isReviewer = profileData?.role === 'reviewer' || profileData?.role === 'admin'

        const query = supabase
            .from('tickets')
            .select(`
                *,
                customer:customers(name, email),
                assigned:profiles!tickets_assigned_to_fkey(full_name)
            `)
            .order('created_at', { ascending: false })

        // Apply different filters based on role
        if (isReviewer) {
            query.or(`assigned_to.eq.${session.user.id},and(assigned_to.is.null,status.eq.open)`)
        } else {
            query.eq('created_by', session.user.id)
        }

        const { data: rawData, error } = await query

        if (!error && rawData) {
            // Get all unique creator IDs
            const creatorIds = Array.from(new Set(
                rawData
                    .map(t => t.created_by)
                    .filter((id): id is string => id !== null)
            ))

            console.log('Creator IDs:', creatorIds)

            // Fetch creator emails using the get_user_emails function
            const { data: creatorData, error: creatorError } = await supabase
                .rpc('get_user_emails', {
                    user_ids: creatorIds
                })

            if (creatorError) {
                console.error('Error fetching creator data:', creatorError)
            }
            console.log('Creator data:', creatorData)

            // Create a map of creator IDs to emails
            const creatorMap = new Map(creatorData?.map(c => [c.id, c.email]) || [])
            console.log('Creator map:', Object.fromEntries(creatorMap))

            const formattedData = rawData.map(ticket => {
                const creatorEmail = ticket.created_by ? creatorMap.get(ticket.created_by) : null
                console.log('Ticket creator:', ticket.created_by, 'Email:', creatorEmail)
                return {
                    ...ticket,
                    customer: ticket.customer,
                    assigned: ticket.assigned,
                    creator: ticket.created_by ? { email: creatorEmail || 'Unknown' } : null
                }
            })
            setTickets(formattedData as unknown as Ticket[])
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