'use client'

import { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { ChatMessage } from '@/types/chat'
import { useToast } from '@/hooks/use-toast'
import { closeTicket } from '@/app/api/tickets/[id]/actions'
import { AgentResponse } from '@/lib/ai/agent-interfaces'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UseChatProps {
    ticketId?: string
}

export function useChat({ ticketId }: UseChatProps = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const sendMessage = async (content: string) => {
        try {
            setIsLoading(true)
            console.log('🔍 Starting message send...')

            // Check if we have a valid session
            console.log('🔑 Checking Supabase session...')
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            console.log('📦 Session data:', sessionData)

            if (sessionError) {
                console.error('❌ Session error:', sessionError)
                router.push('/auth/login')
                throw new Error('Authentication error: ' + sessionError.message)
            }

            if (!sessionData.session) {
                console.error('❌ No session found')
                router.push('/auth/login')
                throw new Error('Please sign in to continue')
            }

            // Refresh session if it's about to expire
            const expiresAt = sessionData.session.expires_at
            const fiveMinutes = 5 * 60 // 5 minutes in seconds
            if (expiresAt && expiresAt - Math.floor(Date.now() / 1000) < fiveMinutes) {
                console.log('🔄 Refreshing session...')
                const { error: refreshError } = await supabase.auth.refreshSession()
                if (refreshError) {
                    console.error('❌ Session refresh error:', refreshError)
                    router.push('/auth/login')
                    throw new Error('Session expired. Please sign in again.')
                }
            }

            console.log('✅ Session valid, user:', sessionData.session.user.email)

            // Generate trace ID for metrics
            const traceId = `trace_${nanoid()}`
            console.log('📝 Generated trace ID:', traceId)

            // Add user message
            const userMessage: ChatMessage = {
                role: 'user',
                content,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, userMessage])

            // Call AI endpoint
            console.log('🚀 Calling AI endpoint...')
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionData.session.access_token}`
                },
                body: JSON.stringify({
                    message: content,
                    ticketId,
                    traceId
                }),
                credentials: 'include'
            })

            console.log('📡 API Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                })

                if (response.status === 401) {
                    router.push('/auth/login')
                    throw new Error('Session expired. Please sign in again.')
                }
                throw new Error(`Failed to send message: ${response.statusText}`)
            }

            const responseData: AgentResponse = await response.json()
            console.log('✅ Received AI response:', {
                messageLength: responseData.message.length,
                hasToolCalls: !!responseData.tool_calls?.length,
                hasContext: !!responseData.context_used?.length
            })

            // Add AI response
            const aiMessage: ChatMessage = {
                role: 'assistant',
                content: responseData.message,
                timestamp: new Date().toISOString(),
                tool_calls: responseData.tool_calls,
                context_used: responseData.context_used
            }
            setMessages(prev => [...prev, aiMessage])

            // Handle any actions returned by the AI
            const actions = responseData.actions || []
            for (const action of actions) {
                console.log('🎯 Processing action:', action.type)
                if (action.type === 'close_ticket' && ticketId) {
                    await closeTicket(ticketId, action.reason || 'Closed via AI chat')
                    toast({
                        title: 'Ticket Closed',
                        description: 'Your ticket has been closed successfully.',
                    })
                }
            }

            console.log('✨ Message handling completed successfully')
            return true
        } catch (error) {
            console.error('❌ Error in chat:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
                variant: 'destructive'
            })
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return {
        messages,
        sendMessage,
        isLoading
    }
} 