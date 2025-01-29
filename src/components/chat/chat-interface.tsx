'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

export function ChatInterface() {
    const [message, setMessage] = useState('')
    const { messages, sendMessage } = useChat()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return


        await sendMessage(message)
        setMessage('')
    }

    return (
        <div className="flex flex-col h-[600px]">
            <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
                <div className="space-y-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex w-max max-w-[80%] rounded-lg px-4 py-2",
                                msg.role === 'user'
                                    ? "ml-auto bg-primary text-primary-foreground"
                                    : "bg-muted"
                            )}
                        >
                            {msg.content}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[80px]"
                />
                <Button type="submit" >
                    Send
                </Button>
            </form>
        </div>
    )
} 