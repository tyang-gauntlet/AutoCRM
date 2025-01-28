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
    const [error, setError] = useState<string | null>(null)
    const supabase = createClientComponentClient<Database>()

    const fetchTicket = async () => {
        if (!ticketId) return

        try {
            setLoading(true)
            setError(null)

            // Get ticket with creator's email in a single query
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    created_by_profile:profiles!tickets_created_by_fkey (
                        email
                    )
                `)
                .eq('id', ticketId)
                .single()

            if (ticketError) throw ticketError

            if (ticketData) {
                const formattedTicket: Ticket = {
                    ...ticketData,
                    customer: null,
                    assigned: null,
                    creator: ticketData.created_by_profile
                        ? { email: ticketData.created_by_profile.email }
                        : null,
                    priority: ticketData.priority as TicketPriority,
                    status: ticketData.status as TicketStatus
                }
                setTicket(formattedTicket)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ticket')
        } finally {
            setLoading(false)
        }
    }

    // Fetch ticket and messages
    useEffect(() => {
        fetchTicket()
    }, [ticketId])

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!ticketId) return false

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) throw new Error('No authenticated user')

            // Insert message and get sender profile in one query
            const { data: messageData, error: messageError } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    content,
                    sender_id: user.id
                })
                .select(`
                    *,
                    sender:profiles!ticket_messages_sender_id_fkey (
                        id,
                        full_name,
                        email
                    )
                `)
                .single()

            if (messageError) throw messageError

            const newMessage = {
                ...messageData,
                sender: {
                    full_name: messageData.sender?.full_name || 'Unknown',
                    email: messageData.sender?.email || 'Unknown'
                }
            }

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
        // If there's no ticket, don't even subscribe
        if (!ticketId) return;
        let mounted = true;

        console.log('Setting up subscriptions for ticket:', ticketId);
        const fetchData = async () => {
            if (!mounted) return;
            await fetchTicket();
        };

        fetchData();

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
                async payload => {
                    if (!mounted) return;
                    await fetchData();
                }
            )
            .subscribe();

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
                                sender:profiles!ticket_messages_sender_id_fkey (
                                    id,
                                    full_name,
                                    email
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (messageError) throw messageError
                        if (!messageData.sender_id) throw new Error('No sender ID')

                        // Then get the sender's email

                        const newMessage = {
                            ...messageData,
                            sender: {
                                ...messageData.sender,
                                email: messageData.sender?.email || 'Unknown'
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
            .subscribe();

        return () => {
            console.log('Cleaning up subscriptions for ticket:', ticketId);
            mounted = false;
            ticketChannel.unsubscribe();
            messageChannel.unsubscribe();

            supabase.removeChannel(ticketChannel);
            supabase.removeChannel(messageChannel);
        };
    }, [ticketId]);

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