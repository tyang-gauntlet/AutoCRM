import { Client, Run } from 'langsmith'
import { langsmith, TRACING_CONFIG, getTraceName } from './config'
import { ChatMessage } from '@/types/chat'
import { AgentResponse, RAGContext } from '../ai/agent-interfaces'

interface TraceMetadata {
    userId: string
    ticketId?: string | null
    conversationId?: string
    messageId?: string
    operation_type?: string
    tool?: string
    tags?: string[]
}

interface TraceData {
    input: any
    output?: any
    error?: Error
}

// Define our own RunUpdate type since langsmith doesn't export it
interface RunUpdate {
    outputs?: any
    error?: string
    end_time?: number
}

export async function startTrace(
    operation: string,
    metadata: TraceMetadata,
    parentRunId?: string
): Promise<Run | null> {
    if (!TRACING_CONFIG.enabled) return null

    const traceName = getTraceName(operation)
    try {
        const runResult = await langsmith.createRun({
            name: traceName,
            run_type: 'chain',
            inputs: { metadata },
            parent_run_id: parentRunId,
            project_name: TRACING_CONFIG.projectName,
            extra: {
                userId: metadata.userId,
                ticketId: metadata.ticketId,
                conversationId: metadata.conversationId,
                messageId: metadata.messageId,
                operation_type: metadata.operation_type,
                tool: metadata.tool,
                tags: metadata.tags
            }
        })
        return runResult as unknown as Run
    } catch (error) {
        console.error('Failed to create trace:', error)
        return null
    }
}

export async function endTrace(
    run: Run | null,
    data: TraceData
) {
    if (!run || !TRACING_CONFIG.enabled) return

    try {
        const update: RunUpdate = {
            outputs: data.output,
            error: data.error?.message,
            end_time: Date.now()
        }
        await langsmith.updateRun(run.id, update)
    } catch (error) {
        console.error('Failed to update trace:', error)
    }
}

// Enhance tracing with more detailed metadata and tags
export async function traceConversation(
    operation: string,
    metadata: TraceMetadata,
    callback: () => Promise<AgentResponse>,
    parentRunId?: string
) {
    const run = await startTrace(operation, {
        ...metadata,
        operation_type: 'conversation',
        tags: ['conversation', 'autocrm']
    }, parentRunId)

    try {
        const result = await callback()
        await endTrace(run, {
            input: metadata,
            output: {
                ...result,
                metrics: {
                    ...result.metrics,
                    timestamp: Date.now(),
                    operation: operation
                }
            }
        })
        return result
    } catch (error) {
        await endTrace(run, {
            input: metadata,
            error: error as Error
        })
        throw error
    }
}

export async function traceRAGOperation(
    operation: string,
    metadata: TraceMetadata,
    query: string,
    callback: () => Promise<RAGContext[]>,
    parentRunId?: string
) {
    const run = await startTrace(operation, {
        ...metadata,
        operation_type: 'rag',
        tags: ['rag', 'knowledge_retrieval', 'autocrm']
    }, parentRunId)

    try {
        const startTime = Date.now()
        const result = await callback()
        const endTime = Date.now()

        await endTrace(run, {
            input: { query, metadata },
            output: {
                contexts: result,
                metrics: {
                    count: result.length,
                    avgSimilarity: result.reduce((acc, ctx) => acc + ctx.similarity, 0) / result.length,
                    maxSimilarity: Math.max(...result.map(ctx => ctx.similarity)),
                    latency: endTime - startTime,
                    timestamp: endTime,
                    operation: operation
                }
            }
        })
        return result
    } catch (error) {
        await endTrace(run, {
            input: { query, metadata },
            error: error as Error
        })
        throw error
    }
}

export async function traceToolExecution(
    operation: string,
    metadata: TraceMetadata,
    toolName: string,
    params: any,
    callback: () => Promise<any>,
    parentRunId?: string
) {
    const run = await startTrace(operation, {
        ...metadata,
        operation_type: 'tool_execution',
        tool: toolName,
        tags: ['tool_execution', toolName, 'autocrm']
    }, parentRunId)

    try {
        const startTime = Date.now()
        const result = await callback()
        const endTime = Date.now()

        await endTrace(run, {
            input: { tool: toolName, params, metadata },
            output: {
                result,
                metrics: {
                    success: !result?.error,
                    latency: endTime - startTime,
                    timestamp: endTime,
                    operation: operation,
                    tool: toolName
                }
            }
        })
        return result
    } catch (error) {
        await endTrace(run, {
            input: { tool: toolName, params, metadata },
            error: error as Error
        })
        throw error
    }
} 
