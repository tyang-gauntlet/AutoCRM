import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { nanoid } from 'nanoid'
import { AgentResponse, KRAMetrics, RGQSMetrics, RAGContext } from './agent-interfaces'
import { searchKnowledge, formatContext } from './rag'
import { executeToolCall, tools, formatToolResult } from './tools'
import { recordKRAMetrics, recordRGQSMetrics } from './metrics'
import { processConversation } from './conversation-graph'
import { ChatMessage } from '@/types/chat'
import { SYSTEM_PROMPT } from './prompts'

const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000
})

export async function handleChat(
    message: string | null,
    userId: string,
    previousMessages: ChatMessage[],
    ticketId: string | null = null
): Promise<AgentResponse> {
    const traceId = nanoid()
    console.log('🔍 Starting chat processing:', {
        traceId,
        userId,
        messageLength: message?.length ?? 0,
        previousMessagesCount: previousMessages.length,
        ticketId,
        isInitialState: !message
    })

    try {
        // Process the conversation using our LangGraph implementation
        const response = await processConversation(
            message || '', // Empty string for initial state
            userId,
            previousMessages,
            ticketId
        )

        console.log('🏁 Chat processing complete:', {
            responseLength: response.message.length,
            toolCallsCount: response.tool_calls?.length || 0,
            contextCount: response.context_used?.length || 0
        })

        return response
    } catch (error) {
        console.error('❌ Fatal error in chat processing:', {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            traceId,
            userId,
            messageLength: message?.length ?? 0
        })
        return {
            message: 'I apologize, but I encountered an error processing your request. Please try again or contact human support.',
            metrics: {}
        }
    }
} 