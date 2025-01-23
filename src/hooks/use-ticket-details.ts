import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
    priority: TicketPriority
    status: TicketStatus
}

type Message = {
    id: string
    content: string
    created_at: string
    sender_id: string
    sender: {
        full_name: string
        email: string
    }
}

type TicketActions = {
    sendMessage: (content: string) => Promise<boolean>
    updateStatus?: (newStatus: string) => Promise<boolean>
    assignToMe?: () => Promise<boolean>
}

export function useTicketDetails(ticketId: string, role?: 'reviewer' | 'user'): {
    ticket: Ticket | null
    messages: Message[]
    loading: boolean
} & TicketActions {
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    // Fetch ticket and messages
    const fetchTicket = useCallback(async () => {
        console.log('Fetching ticket:', ticketId)
        try {
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    customer:customers(name),
                    assigned:profiles(full_name)
                `)
                .eq('id', ticketId)
                .single()

            if (ticketError) throw ticketError

            console.log('Ticket data received:', ticketData)
            setTicket(ticketData as Ticket)

            // First get all messages to collect sender IDs
            const { data: messages, error: messagesError } = await supabase
                .from('ticket_messages')
                .select(`
                    *,
                    sender:profiles(
                        id,
                        full_name
                    )
                `)
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true })

            if (messagesError) throw messagesError

            // Get unique sender IDs
            const senderIds = Array.from(new Set(
                messages?.map(msg => msg.sender_id).filter((id): id is string => id !== null)
            ))

            // Get emails for all senders
            const { data: emailData } = await supabase
                .rpc('get_user_emails', {
                    user_ids: senderIds
                })

            // Map the emails to the messages
            const emailMap = new Map(emailData?.map(u => [u.id, u.email]) || [])
            const messagesWithEmails = messages?.map(msg => ({
                ...msg,
                sender: {
                    ...msg.sender,
                    email: emailMap.get(msg.sender_id || '') || 'Unknown'
                }
            }))

            setMessages(messagesWithEmails as Message[])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, ticketId])

    // Send message
    const sendMessage = async (content: string) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return false

        const { error } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticketId,
                content,
                sender_id: session.user.id
            })

        if (error) {
            console.error('Error sending message:', error)
            return false
        }

        return true
    }

    // Update ticket status (reviewer only)
    const updateStatus = async (newStatus: string) => {
        if (role !== 'reviewer') return false
        console.log('Updating status to:', newStatus)

        const { error } = await supabase
            .from('tickets')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString() // Add this to force an update
            })
            .eq('id', ticketId)

        if (error) {
            console.error('Error updating status:', error)
            return false
        }

        console.log('Status updated successfully')
        await fetchTicket() // Immediately fetch updated data
        return true
    }

    // Assign ticket to current user (reviewer only)
    const assignToMe = async () => {
        if (role !== 'reviewer') return false

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

        return true
    }

    useEffect(() => {
        console.log('Setting up subscriptions for ticket:', ticketId)
        let mounted = true

        const fetchData = async () => {
            if (!mounted) return
            await fetchTicket()
        }

        fetchData()

        // Subscribe to ticket changes
        const ticketChannel = supabase
            .channel(`ticket-${ticketId}-details`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                    filter: `id=eq.${ticketId}`
                },
                async (payload) => {
                    console.log('Ticket update received:', payload)
                    if (!mounted) return
                    await fetchData()
                }
            )
            .subscribe((status) => {
                console.log('Ticket subscription status:', status)
            })

        // Subscribe to messages
        const messageChannel = supabase
            .channel(`ticket-${ticketId}-messages`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                },
                async (payload) => {
                    console.log('Message received:', payload)
                    if (!mounted) return
                    if (!payload.new.sender_id) return

                    const { data: messageData, error } = await supabase
                        .rpc('get_user_emails', {
                            user_ids: [payload.new.sender_id]
                        })
                        .then(async ({ data: emailData }) => {
                            const { data, error } = await supabase
                                .from('ticket_messages')
                                .select(`
                                    *,
                                    sender:profiles(
                                        id,
                                        full_name
                                    )
                                `)
                                .eq('id', payload.new.id)
                                .single()

                            if (error) throw error

                            // Map the email to the message
                            const email = emailData?.[0]?.email || 'Unknown'
                            return {
                                data: {
                                    ...data,
                                    sender: {
                                        ...data.sender,
                                        email
                                    }
                                },
                                error: null
                            }
                        })

                    if (!error && messageData) {
                        setMessages(current => [...current, messageData as Message])
                    }
                }
            )
            .subscribe((status) => {
                console.log('Message subscription status:', status)
            })

        return () => {
            console.log('Cleaning up subscriptions for ticket:', ticketId)
            mounted = false
            ticketChannel.unsubscribe()
            messageChannel.unsubscribe()
            supabase.removeChannel(ticketChannel)
            supabase.removeChannel(messageChannel)
        }
    }, [ticketId, supabase])

    // Return different actions based on role
    return {
        ticket,
        messages,
        loading,
        sendMessage,
        ...(role === 'reviewer' ? { updateStatus, assignToMe } : {})
    }
} 