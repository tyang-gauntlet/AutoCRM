'use client'

import React, { useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { useChat } from '@/contexts/chat-context'

export function ChatUI() {
    const { clearMessages } = useChat()

    const handleNewChat = useCallback(() => {
        clearMessages()
    }, [clearMessages])

    return (
        <div className="relative">
            <Card className="max-w-4xl mx-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">AI Assistant</h1>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNewChat}
                            className="gap-2"
                        >
                            <PlusCircle className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>
                    <ChatInterface />
                </div>
            </Card>
        </div>
    )
} 