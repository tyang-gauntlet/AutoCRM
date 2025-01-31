import { Client } from 'langsmith'

const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

export interface KRAMetrics {
    query_text: string
    retrieved_chunks: number
    relevant_chunks: number
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
}

interface RunParams {
    name: string
    run_type: string
    inputs: Record<string, any>
    outputs: Record<string, any>
    error?: string
    extra?: {
        tags?: string[]
    }
}

export async function recordKRAMetrics(ticketId: string | null, metrics: KRAMetrics) {
    try {
        const runParams: RunParams = {
            name: 'knowledge_retrieval_accuracy',
            run_type: 'chain',
            inputs: {
                query: metrics.query_text,
                ticket_id: ticketId
            },
            outputs: {
                retrieved_chunks: metrics.retrieved_chunks,
                relevant_chunks: metrics.relevant_chunks,
                accuracy: metrics.accuracy,
                relevance_score: metrics.relevance_score,
                context_match: metrics.context_match
            },
            extra: {
                tags: ['kra', 'metrics', ticketId ? `ticket:${ticketId}` : 'no_ticket']
            }
        }
        await langsmith.createRun(runParams)
    } catch (error) {
        console.error('Error recording KRA metrics:', error)
    }
}

export async function recordRGQSMetrics(ticketId: string | null, metrics: RGQSMetrics) {
    try {
        const runParams: RunParams = {
            name: 'response_generation_quality',
            run_type: 'chain',
            inputs: {
                response_text: metrics.response_text,
                ticket_id: ticketId
            },
            outputs: {
                overall_quality: metrics.overall_quality,
                relevance: metrics.relevance,
                accuracy: metrics.accuracy,
                tone: metrics.tone
            },
            extra: {
                tags: ['rgqs', 'metrics', ticketId ? `ticket:${ticketId}` : 'no_ticket']
            }
        }
        await langsmith.createRun(runParams)
    } catch (error) {
        console.error('Error recording RGQS metrics:', error)
    }
}

export async function recordToolUsage(
    ticketId: string | null,
    toolName: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    success: boolean,
    error?: Error
) {
    try {
        const runParams: RunParams = {
            name: `tool_${toolName}`,
            run_type: 'tool',
            inputs,
            outputs: success ? outputs : { error: error?.toString() || 'Unknown error' },
            error: success ? undefined : error?.toString(),
            extra: {
                tags: ['tool_usage', toolName, success ? 'success' : 'error', ticketId ? `ticket:${ticketId}` : 'no_ticket']
            }
        }
        await langsmith.createRun(runParams)
    } catch (error) {
        console.error('Error recording tool usage:', error)
    }
}

export async function recordPIIDetection(
    ticketId: string | null,
    piiTypes: string[],
    hasPii: boolean,
    originalLength: number,
    scrubbedLength: number
) {
    try {
        const runParams: RunParams = {
            name: 'pii_detection',
            run_type: 'chain',
            inputs: {
                ticket_id: ticketId,
                original_length: originalLength
            },
            outputs: {
                has_pii: hasPii,
                pii_types: piiTypes,
                scrubbed_length: scrubbedLength,
                characters_redacted: originalLength - scrubbedLength
            },
            extra: {
                tags: ['pii', 'security', hasPii ? 'pii_found' : 'no_pii', ticketId ? `ticket:${ticketId}` : 'no_ticket']
            }
        }
        await langsmith.createRun(runParams)
    } catch (error) {
        console.error('Error recording PII detection:', error)
    }
}

export async function recordConversationMetrics(
    ticketId: string | null,
    messageCount: number,
    userMessages: number,
    assistantMessages: number,
    averageResponseTime: number,
    toolsUsed: string[]
) {
    try {
        const runParams: RunParams = {
            name: 'conversation_metrics',
            run_type: 'chain',
            inputs: {
                ticket_id: ticketId
            },
            outputs: {
                message_count: messageCount,
                user_messages: userMessages,
                assistant_messages: assistantMessages,
                average_response_time_ms: averageResponseTime,
                tools_used: toolsUsed
            },
            extra: {
                tags: ['conversation', 'metrics', ticketId ? `ticket:${ticketId}` : 'no_ticket']
            }
        }
        await langsmith.createRun(runParams)
    } catch (error) {
        console.error('Error recording conversation metrics:', error)
    }
}

export async function recordKnowledgeBaseMetrics(
    articleId: string,
    timesRetrieved: number,
    averageRelevance: number,
    lastUsed: Date,
    usedInTickets: string[]
) {
    try {
        const runParams: RunParams = {
            name: 'knowledge_base_metrics',
            run_type: 'chain',
            inputs: {
                article_id: articleId
            },
            outputs: {
                times_retrieved: timesRetrieved,
                average_relevance: averageRelevance,
                last_used: lastUsed.toISOString(),
                used_in_tickets: usedInTickets
            },
            extra: {
                tags: ['knowledge_base', 'metrics', `article:${articleId}`]
            }
        }
        await langsmith.createRun(runParams)
    } catch (error) {
        console.error('Error recording knowledge base metrics:', error)
    }
} 
