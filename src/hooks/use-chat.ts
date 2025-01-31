'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage } from '@/types/chat'
import { useToast } from '@/hooks/use-toast'
import { closeTicket } from '@/app/api/tickets/[id]/actions'
import { AgentResponse } from '@/lib/ai/agent-interfaces'
import { useRouter } from 'next/navigation'

interface UseChatProps {
    ticketId?: string
}

export function useChat({ ticketId }: UseChatProps = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const loadingRef = useRef(false)

    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message])
    }, [])

    const sendMessage = useCallback(async (content: string | null) => {
        console.log('💬 sendMessage called:', {
            content,
            isLoading: loadingRef.current,
            currentMessages: messages.length
        })

        if (loadingRef.current) {
            console.log('⏳ Message skipped - already loading')
            return false
        }

        loadingRef.current = true
        setIsLoading(true)

        try {
            // Add user message if content is provided (not initial greeting)
            if (content !== null) {
                console.log('👤 Adding user message:', content)
                const userMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content,
                    timestamp: new Date().toISOString()
                }
                addMessage(userMessage)
            } else {
                console.log('🤖 Processing initial greeting')
            }

            // Call AI endpoint with latest messages
            const currentMessages = await new Promise<ChatMessage[]>(resolve => {
                setMessages(messages => {
                    resolve(messages)
                    return messages
                })
            })

            console.log('🚀 Calling AI endpoint with messages:', currentMessages.length)
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    ticketId,
                    previousMessages: currentMessages
                })
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            const responseData: AgentResponse = await response.json()
            console.log('✅ Received AI response:', {
                messageLength: responseData.message.length,
                message: responseData.message,
                hasToolCalls: !!responseData.tool_calls?.length,
                hasContext: !!responseData.context_used?.length
            })

            // Add AI response
            console.log('🤖 Adding AI response to messages')
            const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: responseData.message,
                timestamp: new Date().toISOString(),
                tool_calls: responseData.tool_calls,
                context_used: responseData.context_used
            }

            // Update messages with AI response
            addMessage(aiMessage)
            console.log('📝 Setting final messages:', {
                previousCount: currentMessages.length,
                newCount: currentMessages.length + 1,
                messages: [...currentMessages, aiMessage].map(m => ({
                    role: m.role,
                    content: m.content.slice(0, 50)
                }))
            })

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
            loadingRef.current = false
            setIsLoading(false)
        }
    }, [addMessage, ticketId, toast, router])

    return {
        messages,
        sendMessage,
        isLoading,
        clearMessages
    }
} 