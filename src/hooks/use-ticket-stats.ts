import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type TicketStats = {
    activeTickets: number
    queueWaitTime: string
    aiResolutionRate: number
    customerSatisfaction: number
    feedbackCount: number
    highPriorityCount: number
    averageResponseTime: number
    autoResolvedToday: number
    recentActivity: {
        ticketId: string
        title: string
        status: string
        priority: string
        assignedTo: string | null
        timestamp: string
        action: string
    }[]
}

export function useTicketStats() {
    const [stats, setStats] = useState<TicketStats>({
        activeTickets: 0,
        queueWaitTime: '0m',
        aiResolutionRate: 0,
        customerSatisfaction: 0,
        feedbackCount: 0,
        highPriorityCount: 0,
        averageResponseTime: 0,
        autoResolvedToday: 0,
        recentActivity: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = async () => {
        try {
            setError(null)
            const { data: { session } } = await supabase.auth.getSession()
            console.log("FETCHING TICKET STATS", session)
            if (!session) {
                setLoading(false)
                return
            }

            // Get active tickets count
            const { count: activeTickets } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open')
            console.log("ACTIVE TICKETS", activeTickets)
            // Get high priority tickets count
            const { count: highPriorityCount } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .in('priority', ['high', 'urgent'])
                .in('status', ['open', 'in_progress'])
            console.log("HIGH PRIORITY COUNT", highPriorityCount)
            // Calculate queue wait time
            const { data: oldestTicket } = await supabase
                .from('tickets')
                .select('created_at')
                .eq('status', 'open')
                .order('created_at')
                .limit(1)
            console.log("OLD TICKET", oldestTicket)
            let queueWaitTime = '0m'
            if (oldestTicket?.[0]) {
                const waitTimeMinutes = Math.round(
                    (Date.now() - new Date(oldestTicket[0].created_at).getTime()) / (1000 * 60)
                )
                queueWaitTime = `${waitTimeMinutes}m`
            }

            // Calculate AI resolution rate
            const { count: totalResolved } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'resolved')

            const { count: aiResolved } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'resolved')
                .eq('ai_handled', true)

            const aiResolutionRate = totalResolved ? Math.round(((aiResolved || 0) / totalResolved) * 100) : 0

            // Get auto-resolved tickets today
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const { count: autoResolvedToday } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'resolved')
                .eq('ai_handled', true)
                .gte('updated_at', today.toISOString())

            // Calculate average response time (in minutes)
            const { data: recentTickets } = await supabase
                .from('ticket_messages')
                .select('created_at, ticket_id')
                .order('created_at', { ascending: true })

            let averageResponseTime = 0
            if (recentTickets && recentTickets.length > 0) {
                const ticketResponseTimes = new Map<string, number>()

                recentTickets.forEach(message => {
                    if (!ticketResponseTimes.has(message.ticket_id)) {
                        ticketResponseTimes.set(message.ticket_id, new Date(message.created_at).getTime())
                    }
                })

                const totalResponseTime = Array.from(ticketResponseTimes.values()).reduce((acc, firstResponse) => {
                    return acc + (firstResponse - Date.now()) / (1000 * 60)
                }, 0)

                averageResponseTime = Math.abs(Math.round(totalResponseTime / ticketResponseTimes.size))
            }

            // Get recent activity with more details
            const { data: recentActivity } = await supabase
                .from('tickets')
                .select(`
                    id,
                    title,
                    status,
                    priority,
                    created_by,
                    assigned_to,
                    updated_at
                `)
                .order('updated_at', { ascending: false })
                .limit(5)

            // Get user emails for both creators and assignees
            const userIds = recentActivity?.flatMap(ticket => [
                ticket.created_by,
                ticket.assigned_to
            ]).filter(Boolean) as string[] || []

            // Remove duplicates
            const uniqueUserIds = Array.from(new Set(userIds))

            const { data: userEmails } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', uniqueUserIds)

            // Create a map of user IDs to emails
            const emailMap = new Map(userEmails?.map(u => [u.id, u.email]) || [])

            const formattedActivity = recentActivity?.map(ticket => {
                let action = 'updated'
                if (ticket.status === 'resolved') action = 'resolved'
                if (ticket.status === 'open') action = 'opened'
                if (ticket.status === 'in_progress') action = 'started working on'

                // Get the user who performed the action
                const actionPerformer = emailMap.get(ticket.created_by || '') || 'System'

                return {
                    ticketId: ticket.id,
                    title: ticket.title || 'Untitled Ticket',
                    status: ticket.status,
                    priority: ticket.priority,
                    assignedTo: emailMap.get(ticket.assigned_to || '') || null,
                    timestamp: new Date(ticket.updated_at).toISOString(),
                    action: `${action} by ${actionPerformer}`
                }
            }) || []

            // Calculate customer satisfaction from actual feedback
            const { data: feedbackData } = await supabase
                .from('ticket_feedback')
                .select('rating')
                .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

            let customerSatisfaction = 0
            let feedbackCount = 0
            if (feedbackData && feedbackData.length > 0) {
                feedbackCount = feedbackData.length
                const totalRating = feedbackData.reduce((sum, feedback) => sum + feedback.rating, 0)
                customerSatisfaction = Number((totalRating / feedbackCount).toFixed(1))
            }

            setStats({
                activeTickets: activeTickets || 0,
                queueWaitTime,
                aiResolutionRate,
                customerSatisfaction,
                feedbackCount,
                highPriorityCount: highPriorityCount || 0,
                averageResponseTime,
                autoResolvedToday: autoResolvedToday || 0,
                recentActivity: formattedActivity
            })
        } catch (error) {
            console.error('Error fetching ticket stats:', error)
            setError('Failed to fetch ticket statistics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let mounted = true

        const fetchAndSetStats = async () => {
            if (!mounted) return
            await fetchStats()
        }

        fetchAndSetStats()

        // Set up real-time subscription
        const channel = supabase.channel('tickets-changes', {
            config: {
                broadcast: { self: true },
                presence: {
                    key: 'tickets-dashboard',
                },
            },
        })

        // Subscribe to all ticket changes
        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                },
                async (payload) => {
                    console.log('Ticket change detected:', payload)
                    if (mounted) {
                        await fetchAndSetStats()
                    }
                }
            )
            .subscribe(async (status) => {
                console.log('Subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to ticket changes')
                    // Initial fetch after subscription
                    await fetchAndSetStats()
                }
            })

        return () => {
            console.log('Cleaning up subscription...')
            mounted = false
            supabase.removeChannel(channel)
        }
    }, []) // fetchStats is intentionally omitted to prevent re-subscriptions

    // Expose the stats and a manual refresh function
    return {
        stats,
        loading,
        error,
        refreshStats: fetchStats
    }
} 