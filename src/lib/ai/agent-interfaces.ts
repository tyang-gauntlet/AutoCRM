import { ChatMessage } from '@/types/chat'
import { Database } from '@/types/database'

export type Tool = {
    name: string
    description: string
    parameters: Record<string, unknown>
    required_role: 'admin' | 'reviewer' | 'user' | 'authenticated'
    enabled: boolean
}

export type KRAMetrics = {
    query_text: string
    retrieved_chunks: number
    relevant_chunks: number
    accuracy: number
    relevance_score: number
    context_match: number
}

export type RGQSMetrics = {
    response_text: string
    overall_quality: number
    relevance: number
    accuracy: number
    tone: number
}

export interface ToolCall {
    id: string
    name: string
    args: any
    result: any | null
    error: string | null
    startTime: string
    endTime: string
}

export type RAGContext = {
    article_id: string
    title: string
    content: string
    similarity: number
}

export type AgentAction = {
    type: 'close_ticket' | 'elevate_ticket' | 'create_ticket'
    reason?: string
}

export type AgentResponse = {
    message: string
    tool_calls?: ToolCall[]
    context_used?: RAGContext[]
    metrics?: {
        kra?: KRAMetrics
        rgqs?: RGQSMetrics
    }
    actions?: AgentAction[]
}

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type KBArticle = Database['public']['Tables']['kb_articles']['Row']
export type KBEmbedding = Database['public']['Tables']['kb_embeddings']['Row'] 