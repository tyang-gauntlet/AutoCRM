'use client'

import React, { useState, useRef, useEffect, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChat } from '@/contexts/chat-context'
import { cn } from '@/lib/utils'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ToolCall } from '@/lib/ai/agent-interfaces'

export function ChatInterface() {
    const { messages, sendMessage, isLoading } = useChat()
    const [message, setMessage] = useState('')
    const [showContext, setShowContext] = useState<Record<number, boolean>>({})
    const [showToolCalls, setShowToolCalls] = useState<Record<string, boolean>>({})
    const scrollRef = useRef<HTMLDivElement>(null)
    const prevMessagesLength = useRef(messages.length)



    // Auto scroll to bottom on new messages
    useEffect(() => {
        // Only scroll if messages were added
        if (messages.length > prevMessagesLength.current) {
            console.log('📜 Scrolling to bottom')
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' })
            }
        }
        prevMessagesLength.current = messages.length
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isLoading) return

        console.log('📤 Submitting message:', message)
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
        <div className="flex flex-col h-[calc(100vh-10rem)]">
            <ScrollArea className="flex-1 p-3 border rounded-lg mb-3">
                <div className="space-y-3 max-w-full">
                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className={cn(
                                "flex",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}>
                                <div
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 max-w-[85%] whitespace-pre-wrap break-words text-[13px]",
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
                                    "p-2 space-y-1.5 max-w-[85%] text-[11px]",
                                    msg.role === 'user' ? "ml-auto" : ""
                                )}>
                                    <button
                                        onClick={() => toggleToolCall(tool.id)}
                                        className="flex items-center gap-1.5 w-full hover:bg-muted/50 p-1 rounded"
                                    >
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tool.name}</Badge>
                                        {showToolCalls[tool.id] ? (
                                            <ChevronUp className="h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3" />
                                        )}
                                        <span className="text-[10px] text-muted-foreground">
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
                                            {tool.result !== undefined && tool.result !== null && (
                                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                                    {tool.name === 'createTicket' && typeof tool.result === 'object' && tool.result !== null ? (
                                                        JSON.stringify({
                                                            ticket_id: (tool.result as { id: string }).id,
                                                            title: (tool.result as { title: string }).title,
                                                            status: 'open'
                                                        }, null, 2)
                                                    ) : (
                                                        Array.isArray(tool.result)
                                                            ? JSON.stringify(tool.result, null, 2)
                                                            : typeof tool.result === 'object'
                                                                ? JSON.stringify(tool.result, null, 2)
                                                                : String(tool.result)
                                                    )}
                                                </pre>
                                            )}
                                        </Fragment>
                                    )}
                                </Card>
                            ))}

                            {/* Tool Usage Metrics */}
                            {msg.metrics?.tool_usage && (
                                <Card className={cn(
                                    "p-3 space-y-2 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto" : ""
                                )}>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Tool Usage</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {msg.metrics.tool_usage.tool}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        <div className="p-2 bg-muted rounded">
                                            <pre className="whitespace-pre-wrap break-words">
                                                {JSON.stringify(msg.metrics.tool_usage, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Context Used */}
                            {msg.context_used && msg.context_used.length > 0 && (
                                <Card className={cn(
                                    "p-2 space-y-1.5 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto" : ""
                                )}>
                                    <button
                                        onClick={() => toggleContext(i)}
                                        className="flex items-center gap-1.5 w-full hover:bg-muted/50 p-1 rounded"
                                    >
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Knowledge Base Context</Badge>
                                        {showContext[i] ? (
                                            <ChevronUp className="h-3 w-3" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3" />
                                        )}
                                        <span className="text-[10px] text-muted-foreground">
                                            {msg.context_used.length} source{msg.context_used.length !== 1 ? 's' : ''}
                                        </span>
                                    </button>

                                    {showContext[i] && (
                                        <div className="text-xs text-muted-foreground mt-2 space-y-2">
                                            {msg.context_used.map((ctx, idx) => (
                                                <div key={idx} className="p-2 bg-muted rounded">
                                                    <div className="font-medium text-foreground">
                                                        {ctx.title}
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
                    className="min-h-[60px] max-h-[160px] resize-none text-[13px]"
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    disabled={isLoading || !message.trim()}
                    className="text-[13px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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