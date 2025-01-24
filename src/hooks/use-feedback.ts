'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type TicketFeedback = Database['public']['Tables']['ticket_feedback']['Row'] & {
    tickets: {
        title: string
        customer_id: string | null
        created_by: string | null
        customer: {
            name: string
            company: string | null
        } | null
        creator: {
            full_name: string | null
        } | null
    } | null
}

export function useFeedback() {
    const [feedback, setFeedback] = useState<TicketFeedback[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        async function fetchFeedback() {
            try {
                setIsLoading(true)
                setError(null)

                const { data: session, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) throw new Error('Authentication error: ' + sessionError.message)
                if (!session?.session?.user) throw new Error('No session found')

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.session.user.id)
                    .single()

                if (profileError) throw new Error('Profile error: ' + profileError.message)
                if (!profile?.role) throw new Error('No role found')
                if (!['admin', 'reviewer'].includes(profile.role)) throw new Error('Unauthorized role')

                const { data, error: feedbackError } = await supabase
                    .from('ticket_feedback')
                    .select(`
                        *,
                        tickets:ticket_id (
                            title,
                            customer_id,
                            created_by,
                            customer:customer_id (
                                name,
                                company
                            ),
                            creator:profiles!created_by (
                                full_name
                            )
                        )
                    `)
                    .order('created_at', { ascending: false })

                if (feedbackError) throw new Error('Feedback error: ' + feedbackError.message)
                if (!data) throw new Error('No feedback data found')

                setFeedback(data as TicketFeedback[])
            } catch (err) {
                console.error('Error fetching feedback:', err)
                setError(err instanceof Error ? err.message : 'An error occurred')
                toast.error('Error fetching feedback')
            } finally {
                setIsLoading(false)
            }
        }

        fetchFeedback()
    }, [supabase])

    const stats = useMemo(() => {
        const averageRating = feedback.length > 0
            ? feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length
            : 0

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentFeedback = feedback.filter(
            f => f.created_at && new Date(f.created_at) > sevenDaysAgo
        ).length

        return {
            averageRating,
            totalFeedback: feedback.length,
            recentFeedback
        }
    }, [feedback])

    return {
        feedback,
        isLoading,
        error,
        stats
    }
}
