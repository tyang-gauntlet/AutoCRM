import { ToolCall, RAGContext } from '@/lib/ai/agent-interfaces'

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    tool_calls?: ToolCall[]
    context_used?: RAGContext[]
    metrics?: {
        kra?: any
        rgqs?: any
        tool_usage?: {
            tool: string
            success: boolean
            ticket_id?: string
            was_explicit_request?: boolean
            [key: string]: any
        }
    }
}

export interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
} 