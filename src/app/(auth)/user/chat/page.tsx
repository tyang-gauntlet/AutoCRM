'use client'

import { useEffect, useRef } from 'react'
import { ChatUI } from '@/components/chat/chat-ui'
import { useChat } from '@/contexts/chat-context'

export default function ChatPage() {
    const { sendMessage, messages, initialized } = useChat()
    const isGreetingInProgress = useRef(false)

    // Send initial message to trigger greeting only if no messages exist
    useEffect(() => {
        if (!initialized) return

        // Only send greeting if there are no messages and we haven't started the greeting
        if (messages.length === 0 && !isGreetingInProgress.current) {
            console.log('🔄 No messages found, sending greeting')
            isGreetingInProgress.current = true
            void sendMessage(null)
            return
        }

        // Reset greeting flag when we have messages
        if (messages.length > 0) {
            isGreetingInProgress.current = false
        }
    }, [initialized, sendMessage, messages])

    if (!initialized) return null

    return (
        <div className="container max-w-3xl mx-auto py-6">
            <ChatUI />
        </div>
    )
} 