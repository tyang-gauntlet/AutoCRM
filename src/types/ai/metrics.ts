import { LangSmithRun } from 'langsmith'

export interface AIMetric {
    id: string
    trace_id: string
    ticket_id: string
    type: 'kra' | 'rgqs'
    score: number
    metadata: Record<string, unknown>
    created_at: string
    created_by: string
}

export interface KnowledgeRetrievalMetric {
    id: string
    metric_id: string
    query_text: string
    retrieved_chunks: {
        content: string
        article_id: string
        similarity: number
    }[]
    relevant_chunks: {
        content: string
        article_id: string
        is_relevant: boolean
    }[]
    accuracy: number
    relevance_score: number
    context_match: number
    created_at: string
}

export interface ResponseQualityMetric {
    id: string
    metric_id: string
    response_text: string
    overall_quality: number
    relevance: number
    accuracy: number
    tone: number
    human_rating?: number
    created_at: string
}

export interface MetricsResponse {
    success: boolean
    data: {
        avg_score: number
        count: number
    } | null
}

export interface KRAMetrics {
    query_text: string
    retrieved_chunks: Array<{
        content: string
        article_id: string
        similarity: number
    }>
    relevant_chunks: Array<{
        content: string
        article_id: string
        is_relevant: boolean
    }>
    accuracy: number
    relevance_score: number
    context_match: number
}

export interface RGQSMetrics {
    response_text: string
    overall_quality: number
    relevance: number
    accuracy: number
    tone: number
    human_rating?: number
} 