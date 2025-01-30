'use client'

import React, { useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { ChatInterface } from '@/components/chat/chat-interface'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useChat } from '@/contexts/chat-context'

export function ChatUI() {
    const { clearMessages } = useChat()

    const handleStartOver = useCallback(() => {
        clearMessages()
    }, [clearMessages])

    return (
        <div className="relative">
            <Card className="max-w-3xl mx-auto">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-semibold">AI Assistant</h1>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleStartOver}
                            className="gap-1.5"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <ChatInterface />
                </div>
            </Card>
        </div>
    )
} 