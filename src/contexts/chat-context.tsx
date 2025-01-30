'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types/chat'
import { useToast } from '@/hooks/use-toast'
import { closeTicket } from '@/app/api/tickets/[id]/actions'
import { AgentResponse } from '@/lib/ai/agent-interfaces'
import { useRouter } from 'next/navigation'

interface ChatContextType {
    messages: ChatMessage[]
    isLoading: boolean
    sendMessage: (content: string | null) => Promise<boolean>
    clearMessages: () => void
    initialized: boolean
}

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const loadingRef = useRef(false)

    useEffect(() => {
        setInitialized(true)
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message])
    }, [])

    const sendMessage = useCallback(async (content: string | null) => {
        if (!initialized) {
            console.log('⏳ Skipping message - not initialized')
            return false
        }

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
    }, [initialized, addMessage, messages.length, toast, router])

    return (
        <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearMessages, initialized }}>
            {children}
        </ChatContext.Provider>
    )
}

export function useChat() {
    const context = useContext(ChatContext)
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider')
    }
    return context
} 