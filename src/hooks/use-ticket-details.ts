import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name' | 'email'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
    creator: Pick<Database['public']['Tables']['profiles']['Row'], 'email'> | null
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
    updatePriority?: (newPriority: TicketPriority) => Promise<boolean>
    assignToMe?: () => Promise<boolean>
}

export function useTicketDetails(ticketId: string | undefined, role?: 'reviewer' | 'user'): {
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
        if (!ticketId) {
            setTicket(null)
            setMessages([])
            setLoading(false)
            return
        }

        console.log('Fetching ticket:', ticketId)
        try {
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    customer:customers(name, email),
                    assigned:profiles!tickets_assigned_to_fkey(full_name),
                    creator:profiles!tickets_created_by_fkey(email)
                `)
                .eq('id', ticketId)
                .single()

            if (ticketError) throw ticketError

            // If we have a creator ID, fetch their email
            let formattedTicket = {
                ...ticketData,
                customer: ticketData.customer,
                assigned: ticketData.assigned,
                creator: null
            } as Ticket

            if (ticketData.created_by) {
                const { data: creatorData } = await supabase
                    .rpc('get_user_emails', {
                        user_ids: [ticketData.created_by]
                    })

                if (creatorData?.[0]) {
                    formattedTicket.creator = { email: creatorData[0].email }
                }
            }

            console.log('Ticket data received:', formattedTicket)
            setTicket(formattedTicket)

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
    }, [ticketId])

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!ticketId) return false

        try {
            // Get current user ID
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) throw new Error('No authenticated user')

            // First insert the message
            const { data: messageData, error: messageError } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    content,
                    sender_id: user.id
                })
                .select(`
                    *,
                    sender:profiles(
                        id,
                        full_name
                    )
                `)
                .single()

            if (messageError) throw messageError
            if (!messageData.sender_id) throw new Error('No sender ID')

            // Then get the sender's email
            const { data: emailData } = await supabase
                .rpc('get_user_emails', {
                    user_ids: [messageData.sender_id]
                })

            const newMessage = {
                ...messageData,
                sender: {
                    ...messageData.sender,
                    email: emailData?.[0]?.email || 'Unknown'
                }
            }

            console.log('Sent message with email:', newMessage)
            setMessages(current => [...current, newMessage as Message])
            return true
        } catch (error) {
            console.error('Error sending message:', error)
            return false
        }
    }, [ticketId, supabase])

    // Update status (reviewer only)
    const updateStatus = useCallback(async (newStatus: string) => {
        if (!ticketId) return false

        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status: newStatus })
                .eq('id', ticketId)

            if (error) throw error

            setTicket(current => current ? { ...current, status: newStatus as TicketStatus } : null)
            return true
        } catch (error) {
            console.error('Error updating status:', error)
            return false
        }
    }, [ticketId, supabase])

    // Update priority (reviewer only)
    const updatePriority = useCallback(async (newPriority: TicketPriority) => {
        if (!ticketId) return false

        try {
            const { error } = await supabase
                .from('tickets')
                .update({ priority: newPriority })
                .eq('id', ticketId)

            if (error) throw error

            setTicket(current => current ? { ...current, priority: newPriority } : null)
            return true
        } catch (error) {
            console.error('Error updating priority:', error)
            return false
        }
    }, [ticketId, supabase])

    // Assign to me (reviewer only)
    const assignToMe = useCallback(async () => {
        if (!ticketId) return false

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) throw userError || new Error('No user found')

            const { error } = await supabase
                .from('tickets')
                .update({ assigned_to: user.id })
                .eq('id', ticketId)

            if (error) throw error

            // Refetch ticket to get updated data
            await fetchTicket()
            return true
        } catch (error) {
            console.error('Error assigning ticket:', error)
            return false
        }
    }, [ticketId, supabase, fetchTicket])

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

                    try {
                        // First get the message data with sender profile
                        const { data: messageData, error: messageError } = await supabase
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

                        if (messageError) throw messageError
                        if (!messageData.sender_id) throw new Error('No sender ID')

                        // Then get the sender's email
                        const { data: emailData } = await supabase
                            .rpc('get_user_emails', {
                                user_ids: [messageData.sender_id]
                            })

                        const newMessage = {
                            ...messageData,
                            sender: {
                                ...messageData.sender,
                                email: emailData?.[0]?.email || 'Unknown'
                            }
                        }

                        console.log('New message with email:', newMessage)
                        // Check if message already exists before adding
                        setMessages(current => {
                            const exists = current.some(msg => msg.id === newMessage.id)
                            return exists ? current : [...current, newMessage as Message]
                        })
                    } catch (error) {
                        console.error('Error handling new message:', error)
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

    // Return empty state if no ticketId
    if (!ticketId) {
        return {
            ticket: null,
            messages: [],
            loading: false,
            sendMessage: async () => false,
            ...(role === 'reviewer' ? {
                updateStatus: async () => false,
                updatePriority: async () => false,
                assignToMe: async () => false,
            } : {})
        }
    }

    return {
        ticket,
        messages,
        loading,
        sendMessage,
        ...(role === 'reviewer' ? {
            updateStatus,
            updatePriority,
            assignToMe,
        } : {})
    }
} 