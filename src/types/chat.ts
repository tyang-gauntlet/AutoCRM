import { ToolCall, RAGContext } from '@/lib/ai/agent-interfaces'

export type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    tool_calls?: ToolCall[]
    context_used?: RAGContext[]
}

export interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
} 