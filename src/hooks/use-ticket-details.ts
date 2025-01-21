import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    customer: Pick<Database['public']['Tables']['customers']['Row'], 'name'> | null
    assigned: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

type Message = {
    id: string
    content: string
    created_at: string
    sender_id: string
    sender: {
        full_name: string
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
    const fetchTicket = async () => {
        const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select(`
                *,
                customer:customers(name),
                assigned:profiles(full_name)
            `)
            .eq('id', ticketId)
            .single()

        if (ticketError) {
            console.error('Error fetching ticket:', ticketError)
            return
        }

        setTicket(ticketData)

        const { data: messagesData, error: messagesError } = await supabase
            .from('ticket_messages')
            .select(`
                *,
                sender:profiles(full_name)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true })

        if (messagesError) {
            console.error('Error fetching messages:', messagesError)
            return
        }

        setMessages(messagesData)
        setLoading(false)
    }

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

        const { error } = await supabase
            .from('tickets')
            .update({ status: newStatus })
            .eq('id', ticketId)

        if (error) {
            console.error('Error updating status:', error)
            return false
        }

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
        fetchTicket()

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
                    if (payload.new) {
                        // Immediately update basic fields
                        setTicket(current => ({
                            ...current,
                            ...payload.new,
                            // Preserve relationship data until we fetch fresh data
                            customer: current?.customer,
                            assigned: current?.assigned
                        }))

                        // Then fetch fresh data to update relationships
                        const { data } = await supabase
                            .from('tickets')
                            .select(`
                                *,
                                customer:customers(name),
                                assigned:profiles(full_name)
                            `)
                            .eq('id', ticketId)
                            .single()

                        if (data) {
                            setTicket(data)
                        }
                    }
                }
            )
            .subscribe()

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
                (payload) => {
                    setMessages(current => [...current, payload.new as Message])
                }
            )
            .subscribe()

        return () => {
            console.log('Cleaning up subscriptions')
            supabase.removeChannel(ticketChannel)
            supabase.removeChannel(messageChannel)
        }
    }, [supabase, ticketId])

    // Return different actions based on role
    return {
        ticket,
        messages,
        loading,
        sendMessage,
        ...(role === 'reviewer' ? { updateStatus, assignToMe } : {})
    }
} 