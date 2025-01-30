'use client'

import { useEffect, useRef } from 'react'
import { ChatUI } from '@/components/chat/chat-ui'
import { useChat } from '@/contexts/chat-context'

export default function ChatPage() {
    const { sendMessage, messages, initialized } = useChat()
    const isInitialMount = useRef(true)
    const isGreetingInProgress = useRef(false)

    // Send initial message to trigger greeting
    useEffect(() => {
        if (!initialized) return

        // Only send greeting on initial mount
        if (isInitialMount.current) {
            console.log('🔄 Initial mount, sending greeting')
            isInitialMount.current = false
            isGreetingInProgress.current = true
            void sendMessage(null)
            return
        }

        // Handle new chat (messages cleared)
        if (messages.length === 0 && !isGreetingInProgress.current) {
            console.log('🔄 Messages cleared, sending new greeting')
            isGreetingInProgress.current = true
            void sendMessage(null)
        }

        // Reset greeting flag when we have messages
        if (messages.length > 0) {
            isGreetingInProgress.current = false
        }
    }, [initialized, sendMessage, messages])

    if (!initialized) return null

    return (
        <div className="container max-w-4xl mx-auto py-10">
            <ChatUI />
        </div>
    )
} 