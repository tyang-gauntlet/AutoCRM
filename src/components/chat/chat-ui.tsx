'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { ChatInterface } from '@/components/chat/chat-interface'

export function ChatUI() {
    return (
        <Card className="max-w-4xl mx-auto">
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>
                <ChatInterface />
            </div>
        </Card>
    )
} 