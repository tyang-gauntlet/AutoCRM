'use client'

import { useState } from 'react'
import { nanoid } from 'nanoid'
import type { ChatMessage } from '@/types/chat'
import { useToast } from '@/hooks/use-toast'
import { closeTicket } from '@/app/api/tickets/[id]/actions'
import { supabase } from '@/lib/supabase'
import { useAIMetrics } from '@/hooks/use-ai-metrics'

interface UseChatProps {
    ticketId?: string
}

export function useChat({ ticketId }: UseChatProps = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const { recordMetrics } = useAIMetrics(ticketId)

    const sendMessage = async (content: string) => {
        try {
            setIsLoading(true)

            // Generate trace ID for metrics
            const traceId = `trace_${nanoid()}`

            // Add user message
            const userMessage: ChatMessage = {
                role: 'user',
                content,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, userMessage])

            // Call AI endpoint
            const { data: response, error } = await supabase.functions.invoke('chat', {
                body: {
                    message: content,
                    ticketId,
                    traceId
                }
            })

            if (error) throw error

            // Add AI response
            const aiMessage: ChatMessage = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, aiMessage])

            // Record metrics if available
            if (response.context && ticketId) {
                await recordMetrics('kra', traceId, {
                    query_text: content,
                    retrieved_chunks: response.context.chunks,
                    relevant_chunks: response.context.relevant,
                    accuracy: response.context.accuracy,
                    relevance_score: response.context.relevance,
                    context_match: response.context.contextMatch
                })
            }

            if (response.quality && ticketId) {
                await recordMetrics('rgqs', traceId, {
                    response_text: response.message,
                    overall_quality: response.quality.overall,
                    relevance: response.quality.relevance,
                    accuracy: response.quality.accuracy,
                    tone: response.quality.tone
                })
            }

            // Handle any actions returned by the AI
            if (response.actions?.length > 0) {
                for (const action of response.actions) {
                    if (action.type === 'close_ticket' && ticketId) {
                        await closeTicket(ticketId, action.reason || 'Closed via AI chat')
                        toast({
                            title: 'Ticket Closed',
                            description: 'Your ticket has been closed successfully.',
                        })
                    }
                }
            }

            return true
        } catch (error) {
            console.error('Error in chat:', error)
            toast({
                title: 'Error',
                description: 'Failed to send message. Please try again.',
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