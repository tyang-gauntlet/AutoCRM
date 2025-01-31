import { LangChainTracer } from 'langchain/callbacks'
import { TRACING_CONFIG } from './config'
import { ChatOpenAI } from '@langchain/openai'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { AgentAction, AgentFinish } from '@langchain/core/agents'
import { ChainValues } from '@langchain/core/utils/types'
import { Serialized, BaseSerialized } from '@langchain/core/load/serializable'

type CallbackHandlerMethods = BaseCallbackHandler | ((BaseCallbackHandler | null) & {})
type Callbacks = CallbackHandlerMethods[] | undefined

// Create a custom callback handler for detailed tracing
class DetailedTracer extends BaseCallbackHandler {
    name = 'DetailedTracer'

    async handleLLMStart(
        llm: Serialized,
        prompts: string[],
        runId: string,
        parentRunId?: string,
        extraParams?: Record<string, unknown>,
        tags?: string[],
        metadata?: Record<string, unknown>,
        runName?: string
    ) {
        console.log(`Starting LLM ${llm.id || 'unknown'} with prompts:`, prompts)
    }

    async handleLLMEnd(
        output: { generations: any[] },
        runId: string,
        parentRunId?: string,
        tags?: string[]
    ) {
        console.log('LLM output:', output)
    }

    async handleChainStart(
        chain: Serialized,
        inputs: ChainValues,
        runId: string,
        parentRunId?: string,
        tags?: string[],
        metadata?: Record<string, unknown>,
        runType?: string,
        runName?: string
    ) {
        console.log(`Starting chain ${chain.id || 'unknown'} with inputs:`, inputs)
    }

    async handleChainEnd(
        outputs: ChainValues,
        runId: string,
        parentRunId?: string,
        tags?: string[]
    ) {
        console.log('Chain outputs:', outputs)
    }

    async handleToolStart(
        tool: Serialized,
        input: string,
        runId: string,
        parentRunId?: string,
        tags?: string[],
        metadata?: Record<string, unknown>,
        runName?: string
    ) {
        console.log('Starting tool execution:', { tool, input })
    }

    async handleToolEnd(
        output: string,
        runId: string,
        parentRunId?: string,
        tags?: string[]
    ) {
        console.log('Tool output:', output)
    }

    async handleAgentAction(
        action: AgentAction,
        runId: string,
        parentRunId?: string,
        tags?: string[]
    ) {
        console.log('Agent action:', action)
    }

    async handleAgentFinish(
        finish: AgentFinish,
        runId: string,
        parentRunId?: string,
        tags?: string[]
    ) {
        console.log('Agent finished:', finish)
    }
}

// Create a LangChain tracer with our configuration
export const langchainTracer = new LangChainTracer({
    projectName: TRACING_CONFIG.projectName,
})

// Create a detailed tracer for development
export const detailedTracer = new DetailedTracer()

// Helper to create a traced LLM instance
export function createTracedLLM(
    modelName: string = 'gpt-4-turbo-preview',
    temperature: number = 0.7,
    maxTokens: number = 2000
) {
    const callbacks: Callbacks = TRACING_CONFIG.enabled ? [
        langchainTracer,
        ...(process.env.NODE_ENV === 'development' ? [detailedTracer] : [])
    ] : undefined

    return new ChatOpenAI({
        modelName,
        temperature,
        maxTokens,
        configuration: {
            baseURL: process.env.OPENAI_API_BASE_URL,
        },
        callbacks
    })
}

// Helper to wrap a chain with tracing
export function withTracing<T extends (...args: any[]) => Promise<any>>(
    operation: string,
    callback: T
): T {
    return (async (...args: Parameters<T>) => {
        if (!TRACING_CONFIG.enabled) {
            return callback(...args)
        }

        const tracers = [
            langchainTracer,
            ...(process.env.NODE_ENV === 'development' ? [detailedTracer] : [])
        ]

        const runId = crypto.randomUUID()
        const serializedChain: BaseSerialized<'not_implemented'> = {
            id: [operation],
            name: operation,
            lc: 1,
            type: 'not_implemented'
        }

        const tags = ['autocrm', operation]
        const inputs = { args }

        for (const tracer of tracers) {
            await tracer.handleChainStart(
                serializedChain,
                inputs,
                runId,
                undefined,
                tags
            )
        }

        try {
            const result = await callback(...args)
            const outputs = { result }

            for (const tracer of tracers) {
                await tracer.handleChainEnd(
                    outputs,
                    runId,
                    undefined,
                    tags
                )
            }

            return result
        } catch (error) {
            for (const tracer of tracers) {
                if (tracer.handleChainError) {
                    await tracer.handleChainError(
                        error as Error,
                        runId,
                        undefined,
                        tags,
                        { inputs }
                    )
                }
            }
            throw error
        }
    }) as T
} 
