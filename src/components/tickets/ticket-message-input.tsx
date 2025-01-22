import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TicketMessageInputProps {
    onSend: (message: string) => Promise<boolean>
    disabled?: boolean
    placeholder?: string
}

export function TicketMessageInput({ onSend, disabled, placeholder = "Type your message..." }: TicketMessageInputProps) {
    const [message, setMessage] = useState('')

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || disabled) return

        const success = await onSend(message)
        if (success) {
            setMessage('')
        }
    }

    return (
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={disabled ? "This ticket is closed" : placeholder}
                className="flex-1 min-h-[80px]"
                disabled={disabled}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
                        e.preventDefault()
                        handleSendMessage(e)
                    }
                }}
            />
            <Button type="submit" className="self-end" disabled={disabled}>
                Send
            </Button>
        </form>
    )
} 