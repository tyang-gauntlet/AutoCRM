import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { nanoid } from 'nanoid'
import { AgentResponse, KRAMetrics, RGQSMetrics, RAGContext } from './agent-interfaces'
import { searchKnowledge, formatContext } from './rag'
import { executeToolCall } from './tools'
import { recordKRAMetrics, recordRGQSMetrics, recordToolMetrics } from './metrics'

const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000
})

const SYSTEM_PROMPT = `You are a helpful customer service AI assistant for GauntletAI. 
Your goal is to help users with their support requests using ONLY the provided knowledge base and tools.

IMPORTANT RULES:
1. ONLY use information from the provided knowledge base context
2. If no relevant context is found, say "I don't have information about that in my knowledge base" and suggest contacting human support
3. NEVER use general knowledge or information outside the provided context
4. If the context is partially relevant but incomplete, be explicit about what you know and don't know from the available information

When responding:
1. Always be professional and courteous
2. Cite the specific knowledge base articles you're using
3. Use tools when appropriate to help resolve the request
4. Be explicit when information is not available in the knowledge base

Available tools:
- createTicket: Create a new support ticket
- elevateTicket: Elevate a ticket to human review
- closeTicket: Close a resolved ticket
- searchKnowledge: Search the knowledge base

Remember: You are strictly limited to information in the knowledge base. Do not make assumptions or provide information from general knowledge.`

export async function processMessage(
    message: string,
    ticketId: string | null,
    userId: string
): Promise<AgentResponse> {
    const traceId = nanoid()
    let context: RAGContext[] = []
    let kra: KRAMetrics | undefined
    let rgqs: RGQSMetrics | undefined

    try {
        // Search knowledge base
        context = await searchKnowledge(message)

        // Record KRA metrics
        kra = {
            query_text: message,
            retrieved_chunks: context.length,
            relevant_chunks: context.filter(c => c.similarity > 0.85).length,
            accuracy: context[0]?.similarity || 0,
            relevance_score: context.reduce((acc, c) => acc + c.similarity, 0) / (context.length || 1),
            context_match: context.length ? 1 : 0
        }
        await recordKRAMetrics(traceId, ticketId, kra)

        // Generate response
        const response = await model.invoke([
            new SystemMessage(SYSTEM_PROMPT),
            new SystemMessage(`Remember: Only use information from the provided context. If no relevant context is found, acknowledge that you don't have the information.`),
            new HumanMessage(context.length
                ? `Context:\n${formatContext(context)}\n\nUser: ${message}`
                : `No relevant context found in knowledge base.\n\nUser: ${message}`)
        ])

        const responseText = response.content.toString()

        // Calculate RGQS metrics
        rgqs = {
            response_text: responseText,
            overall_quality: 0.9, // TODO: Implement proper quality scoring
            relevance: 0.9,
            accuracy: 0.9,
            tone: 0.9
        }
        if (rgqs) {
            await recordRGQSMetrics(traceId, ticketId, rgqs)
        }

        // Check for tool calls
        const toolCalls = []
        if (responseText.toLowerCase().includes('create ticket')) {
            const toolCall = await executeToolCall('createTicket', {
                title: 'New support request',
                description: message,
                priority: 'medium'
            }, userId)
            toolCalls.push(toolCall)

            const endTime = toolCall.end_time ? new Date(toolCall.end_time).getTime() : Date.now()
            const startTime = new Date(toolCall.start_time).getTime()

            await recordToolMetrics(
                traceId,
                ticketId,
                'createTicket',
                !toolCall.error,
                endTime - startTime
            )
        }

        // If no context was found, suggest creating a ticket
        if (!context.length && !toolCalls.length) {
            const toolCall = await executeToolCall('createTicket', {
                title: 'Question outside knowledge base',
                description: message,
                priority: 'low'
            }, userId)
            toolCalls.push(toolCall)
        }

        return {
            message: responseText,
            tool_calls: toolCalls,
            context_used: context,
            metrics: { kra, rgqs }
        }
    } catch (error) {
        console.error('Error processing message:', error)
        return {
            message: 'I apologize, but I encountered an error processing your request. Please try again or contact human support.',
            metrics: { kra, rgqs }
        }
    }
} 