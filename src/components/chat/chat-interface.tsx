'use client'

import React, { useState, useRef, useEffect, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ToolCall } from '@/lib/ai/agent-interfaces'

export function ChatInterface() {
    const [message, setMessage] = useState('')
    const [showContext, setShowContext] = useState<Record<number, boolean>>({})
    const [showToolCalls, setShowToolCalls] = useState<Record<string, boolean>>({})
    const { messages, sendMessage, isLoading } = useChat()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isLoading) return

        await sendMessage(message)
        setMessage('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!message.trim() || isLoading) return
            void sendMessage(message)
            setMessage('')
        }
    }

    const toggleContext = (index: number) => {
        setShowContext(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const toggleToolCall = (toolCallId: string) => {
        setShowToolCalls(prev => ({
            ...prev,
            [toolCallId]: !prev[toolCallId]
        }))
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
                <div className="space-y-4 max-w-full">
                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-2">
                            <div className={cn(
                                "flex",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}>
                                <div
                                    className={cn(
                                        "rounded-lg px-4 py-2 max-w-[85%] whitespace-pre-wrap break-words text-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>

                            {/* Tool Calls */}
                            {msg.tool_calls?.map((tool: ToolCall, index) => (
                                <Card key={index} className={cn(
                                    "p-3 space-y-2 max-w-[85%] text-xs",
                                    msg.role === 'user' ? "ml-auto" : ""
                                )}>
                                    <button
                                        onClick={() => toggleToolCall(tool.id)}
                                        className="flex items-center gap-2 w-full hover:bg-muted/50 p-1 rounded"
                                    >
                                        <Badge variant="outline">{tool.name}</Badge>
                                        {showToolCalls[tool.id] ? (
                                            <ChevronUp className="h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3" />
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {tool.end_time ? 'Completed' : 'Running'}
                                        </span>
                                    </button>

                                    {showToolCalls[tool.id] && (
                                        <Fragment>
                                            {tool.error && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>
                                                        {tool.error}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            {tool.result && (
                                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                    {String(typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2))}
                                                </pre>
                                            )}
                                        </Fragment>
                                    )}
                                </Card>
                            ))}

                            {/* Context Used */}
                            {msg.context_used && msg.context_used.length > 0 && (
                                <Card className={cn(
                                    "p-3 space-y-2 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto" : ""
                                )}>
                                    <button
                                        onClick={() => toggleContext(i)}
                                        className="flex items-center gap-2 w-full hover:bg-muted/50 p-1 rounded"
                                    >
                                        <Badge variant="outline">Knowledge Base Context</Badge>
                                        {showContext[i] ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {msg.context_used.length} source{msg.context_used.length !== 1 ? 's' : ''}
                                        </span>
                                    </button>

                                    {showContext[i] && (
                                        <div className="text-xs text-muted-foreground mt-2 space-y-2">
                                            {msg.context_used.map((ctx, idx) => (
                                                <div key={idx} className="p-2 bg-muted rounded">
                                                    <div className="font-medium text-foreground mb-1">
                                                        {ctx.title}
                                                    </div>
                                                    <div className="whitespace-pre-wrap break-words">
                                                        {ctx.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                    className="min-h-[80px] max-h-[200px] resize-none"
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    disabled={isLoading || !message.trim()}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        'Send'
                    )}
                </Button>
            </form>
        </div>
    )
} 