import { useState, useEffect, useCallback } from 'react'
import type { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

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

    const fetchTicket = async () => {
        if (!ticketId) return

        try {
            setLoading(true)
            setError(null)

            console.log('[useTicketDetails] Starting fetch for ticket:', ticketId)

            // Get current user and their profile
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) {
                console.error('[useTicketDetails] Error getting user:', userError)
            } else {
                console.log('[useTicketDetails] Current user:', user)

                if (user?.id) {
                    // Get user's profile to check role
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()

                    if (profileError) {
                        console.error('[useTicketDetails] Error getting profile:', profileError)
                    } else {
                        console.log('[useTicketDetails] User profile:', profile)
                    }
                }
            }

            // TEST QUERY: Fetch all messages directly
            console.log('[useTicketDetails] TEST: Fetching all messages directly...')
            const { data: allMessages, error: allMessagesError } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)

            console.log('[useTicketDetails] TEST: All messages result:', {
                data: allMessages,
                error: allMessagesError
            })

            // First fetch messages to ensure they're available
            console.log('[useTicketDetails] Current user:', await supabase.auth.getUser())

            const messagesQuery = supabase
                .from('ticket_messages')
                .select(`
                    id,
                    content,
                    created_at,
                    sender_id,
                    is_ai,
                    sender:profiles(
                        id,
                        email,
                        full_name,
                        role
                    )
                `)
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true })

            console.log('[useTicketDetails] Messages query:', messagesQuery)
            const { data: messagesData, error: messagesError } = await messagesQuery

            if (messagesError) {
                console.error('[useTicketDetails] Error fetching messages:', messagesError)
                console.error('[useTicketDetails] Messages error details:', JSON.stringify(messagesError, null, 2))
            } else {
                console.log('[useTicketDetails] Successfully fetched messages:', messagesData?.length || 0)
                if (messagesData) {
                    console.log('[useTicketDetails] Raw messages data:', JSON.stringify(messagesData, null, 2))
                } else {
                    console.log('[useTicketDetails] No messages data returned')
                }
                setMessages(messagesData?.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    created_at: msg.created_at,
                    sender_id: msg.sender_id || '',
                    sender: {
                        full_name: msg.sender?.full_name || 'Unknown',
                        email: msg.sender?.email || 'Unknown'
                    }
                })) || [])
            }

            // Then fetch the ticket with detailed logging
            console.log('[useTicketDetails] Fetching ticket details...')
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    customers(
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
                .eq('id', ticketId)
                .maybeSingle()

            console.log('[useTicketDetails] Raw ticket response:', { ticketData, ticketError })

            if (ticketError) {
                console.error('[useTicketDetails] Error fetching ticket data:', ticketError)
                throw ticketError
            }

            if (!ticketData) {
                console.error('[useTicketDetails] No ticket found with ID:', ticketId)
                setError('Ticket not found')
                return
            }

            console.log('[useTicketDetails] Ticket data received:', JSON.stringify(ticketData, null, 2))

            const formattedTicket: Ticket = {
                ...ticketData,
                customer: ticketData.customers ? {
                    name: ticketData.customers.name,
                    email: ticketData.customers.email
                } : null,
                creator: ticketData.creator ? {
                    email: ticketData.creator.email
                } : null,
                assigned: ticketData.assigned ? {
                    full_name: ticketData.assigned.full_name
                } : null,
                priority: ticketData.priority as TicketPriority,
                status: ticketData.status as TicketStatus
            }

            console.log('[useTicketDetails] Formatted ticket:', JSON.stringify(formattedTicket, null, 2))
            setTicket(formattedTicket)
        } catch (err) {
            console.error('[useTicketDetails] Error in fetchTicket:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch ticket')
            setTicket(null)
        } finally {
            setLoading(false)
        }
    }

    // Fetch ticket and messages
    useEffect(() => {
        fetchTicket()
    }, [ticketId, supabase])

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!ticketId) return false

        try {
            console.log('[useTicketDetails] Sending message:', content)
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                console.error('[useTicketDetails] No authenticated user:', userError)
                throw new Error('No authenticated user')
            }

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
                    sender:profiles!ticket_messages_sender_id_fkey(
                        id,
                        email,
                        full_name,
                        role
                    )
                `)
                .single()

            if (messageError) {
                console.error('[useTicketDetails] Error sending message:', messageError)
                throw messageError
            }

            console.log('[useTicketDetails] Message sent successfully:', messageData)

            const newMessage: Message = {
                id: messageData.id,
                content: messageData.content,
                created_at: messageData.created_at,
                sender_id: messageData.sender_id || '',
                sender: {
                    full_name: messageData.sender?.full_name || 'Unknown',
                    email: messageData.sender?.email || 'Unknown'
                }
            }

            setMessages(current => [...current, newMessage])
            return true
        } catch (error) {
            console.error('[useTicketDetails] Error in sendMessage:', error)
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

        console.log('[useTicketDetails] Setting up subscriptions for ticket:', ticketId);
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
                    console.log('[useTicketDetails] Ticket change detected:', payload);
                    if (!mounted) return;
                    await fetchData();
                }
            )
            .subscribe((status) => {
                console.log('[useTicketDetails] Ticket subscription status:', status);
            });

        // Subscribe to messages
        const messageChannel = supabase
            .channel(`ticket-${ticketId}-messages`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                },
                async (payload) => {
                    console.log('[useTicketDetails] Message change detected:', payload);
                    if (!mounted) return;
                    await fetchData();
                }
            )
            .subscribe((status) => {
                console.log('[useTicketDetails] Message subscription status:', status);
            });

        return () => {
            console.log('[useTicketDetails] Cleaning up subscriptions for ticket:', ticketId);
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