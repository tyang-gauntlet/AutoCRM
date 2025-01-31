import { ChatMessage } from '@/types/chat'
import { Client } from 'langsmith'
import { AgentResponse } from '../ai/agent-interfaces'
import { processConversation } from './conversation-graph'
import { v4 as uuidv4 } from 'uuid'

const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

export async function handleChat(
    message: string,
    userId: string,
    previousMessages: ChatMessage[],
    ticketId: string | null = null
): Promise<AgentResponse> {
    try {
        // Generate a unique run ID
        const runId = uuidv4()

        // Create a new run for the entire chat session
        await langsmith.createRun({
            name: 'chat_session',
            run_type: 'chain',
            inputs: {
                message,
                user_id: userId,
                previous_messages: previousMessages,
                ticket_id: ticketId
            },
            extra: {
                tags: ['chat', ticketId ? `ticket:${ticketId}` : 'no_ticket']
            },
            id: runId
        })

        // Process the conversation using our LangGraph implementation
        const response = await processConversation(
            message,
            userId,
            previousMessages,
            ticketId
        )

        // Update the run with the final response
        await langsmith.updateRun(runId, {
            outputs: {
                response: response.message,
                tool_calls: response.tool_calls,
                metrics: response.metrics
            },
            end_time: Date.now()
        })

        return response
    } catch (error) {
        console.error('Error in chat handler:', error)
        return {
            message: 'I apologize, but I encountered an error processing your request. Please try again or contact human support.',
            metrics: {}
        }
    }
} 
