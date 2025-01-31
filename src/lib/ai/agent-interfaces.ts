import { ChatMessage } from '@/types/chat'
import { Database } from '@/types/database'

export interface Tool {
    name: string
    description: string
    parameters: Record<string, {
        type: string
        description: string
        enum?: string[]
        default?: any
    }>
    required_role: string
    enabled: boolean
    implementation: (params: any, userId: string) => Promise<any>
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
    start_time: string
    end_time?: string
    error?: string
    result?: {
        id?: string
        title?: string
        [key: string]: any
    } | any[] | string | number | boolean | null
}

export interface RAGContext {
    title: string
    content: string
    similarity: number
    metadata?: Record<string, any>
}

export type AgentAction = {
    type: 'close_ticket' | 'elevate_ticket' | 'create_ticket'
    reason?: string
}

export interface AgentResponse {
    message: string
    tool_calls?: any[]
    context_used?: RAGContext[]
    metrics?: Record<string, any>
    actions?: AgentAction[]
}

export type Ticket = Database['public']['Tables']['tickets']['Row']
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type KBArticle = Database['public']['Tables']['kb_articles']['Row']
export type KBEmbedding = Database['public']['Tables']['kb_embeddings']['Row'] 