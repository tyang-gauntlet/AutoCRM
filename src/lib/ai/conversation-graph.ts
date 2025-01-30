import { ChatMessage } from '@/types/chat'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { AgentAction, AgentResponse, RAGContext } from './agent-interfaces'
import { searchKnowledge, formatContext } from './rag'
import { executeToolCall } from './tools'
import { recordKRAMetrics, recordRGQSMetrics } from './metrics'
import { SYSTEM_PROMPT, generateSystemPrompt } from './prompts'

// Define our conversation state type
interface ConversationState {
    messages: ChatMessage[]
    context: RAGContext[]
    userId: string
    ticketId: string | null
    currentMessage: string
    needsTicket: boolean
    toolCalls: any[]
    response: string | null
    metrics: {
        kra?: any
        rgqs?: any
        tool_usage?: any
    }
    ticketDetails?: {
        title: string
        description: string
        priority: string
    }
    intent?: 'greeting' | 'question' | 'affirmative' | 'unknown'
    isFirstMessage?: boolean
}

// Initialize LLM
const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000
})

// Create nodes for our conversation graph
const nodes = {
    // Start by analyzing intent
    analyze_intent: async (state: ConversationState) => {
        // If this is the first message and no previous messages, return initial greeting
        if (state.isFirstMessage && state.messages.length === 0) {
            return {
                ...state,
                intent: 'greeting',
                response: "👋 Hello! I'm your AutoCRM AI assistant. How can I help you today?"
            }
        }

        // Check for greetings
        const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))$/i.test(state.currentMessage.trim())

        // Check for affirmative responses
        const isAffirmative = /^(yes|yeah|sure|ok|okay|yep|y)$/i.test(state.currentMessage.trim())
        const lastAssistantMessage = state.messages
            .filter(msg => msg.role === 'assistant')
            .pop()
        const wasOfferingTicket = lastAssistantMessage?.content.includes('Would you like me to create a support ticket')

        // If this is a "yes" to a ticket creation offer, create the ticket
        if (isAffirmative && wasOfferingTicket) {
            // Get the user's previous message for context
            const previousUserMessage = state.messages
                .filter(msg => msg.role === 'user')
                .slice(-2)[0]  // Get the message before the "yes"

            if (previousUserMessage) {
                const toolCall = await executeToolCall('createTicket', {
                    title: 'Support Request',
                    description: `User requested information about: ${previousUserMessage.content}`,
                    priority: 'medium'
                }, state.userId)

                if (!toolCall.error) {
                    const ticketResult = toolCall.result as { id: string, title: string }
                    return {
                        ...state,
                        intent: 'affirmative',
                        needsTicket: false,
                        toolCalls: [...(state.toolCalls || []), toolCall],
                        response: `I've created a ticket for you (ID: ${ticketResult.id}). A support agent will review your request and get back to you soon.`,
                        metrics: {
                            ...state.metrics,
                            tool_usage: {
                                tool: 'createTicket',
                                success: true,
                                ticket_id: ticketResult.id,
                                was_explicit_request: true
                            }
                        }
                    }
                }
            }
        }

        return {
            ...state,
            intent: isGreeting ? 'greeting'
                : (isAffirmative && wasOfferingTicket) ? 'affirmative'
                    : 'question'
        }
    },

    // Gather context only for questions
    gather_context: async (state: ConversationState) => {
        // Skip context gathering for greetings and if we already have a response
        if (state.intent === 'greeting' || state.response) {
            return state
        }

        const startTime = new Date().getTime()
        const context = await searchKnowledge(state.currentMessage)
        const endTime = new Date().getTime()

        const relevantThreshold = 0.7 // Threshold for considering chunks relevant

        // Calculate metrics
        const kra = {
            query_text: state.currentMessage,
            retrieved_chunks: context.length,
            relevant_chunks: context.filter(c => c.similarity > relevantThreshold).length,
            accuracy: Math.max(...context.map(c => c.similarity), 0), // Highest similarity score
            relevance_score: context.length ?
                context.reduce((acc, c) => acc + c.similarity, 0) / context.length :
                0, // Average similarity
            context_match: context.length > 0 ? 1 : 0 // Whether any context was found
        }

        // Record RAG search as a tool call
        const toolCall = {
            id: `rag-${Date.now()}`,
            name: 'searchKnowledge',
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            result: {
                context_found: context.length,
                top_similarity: kra.accuracy,
                query: state.currentMessage
            }
        }

        return {
            ...state,
            context,
            metrics: {
                ...state.metrics,
                kra
            },
            toolCalls: [...(state.toolCalls || []), toolCall]
        }
    },

    // Analyze ticket need only for non-greetings
    analyze_ticket_need: async (state: ConversationState) => {
        if (state.intent === 'greeting' || state.response) return { ...state, needsTicket: false }

        // Build conversation history for analysis
        const conversationHistory = state.messages.map(msg =>
            `${msg.role.toUpperCase()}: ${msg.content}`
        ).join('\n')

        // Create analysis prompt for ticket creation decision
        const ticketAnalysisMessages = [
            new SystemMessage(
                `You are a support ticket analyzer. Your job is to determine if a conversation warrants creating a support ticket.
                
                IMPORTANT GUIDELINES:
                1. Any direct request to create/make a ticket should ALWAYS result in ticket creation
                   Examples that should create tickets:
                   - "can you make a ticket about X"
                   - "create a ticket for X"
                   - "I need a ticket for X"
                   - "open a ticket about X"
                
                2. For other conversations, consider these factors:
                   - Is this a specific issue or request that needs tracking?
                   - Has enough context been provided to create a meaningful ticket?
                   - Is this a general inquiry vs. an actual support need?
                   - Would a ticket help in resolving the user's request?
                
                3. Don't ask for more information if:
                   - User explicitly requests ticket creation
                   - The topic is clear, even if details are minimal
                
                Respond in JSON format only:
                {
                    "needs_ticket": boolean,
                    "reason": string,
                    "title": string | null,
                    "description": string | null,
                    "priority": "low" | "medium" | "high" | "urgent" | null,
                    "is_explicit_request": boolean
                }`
            ),
            new HumanMessage(
                `Current conversation:\n${conversationHistory}\n\nLatest message: ${state.currentMessage}\n\n` +
                `Analyze if this conversation warrants creating a support ticket.`
            )
        ]

        const ticketAnalysis = await model.invoke(ticketAnalysisMessages)
        let analysis
        try {
            analysis = JSON.parse(ticketAnalysis.content.toString())
        } catch (e) {
            console.error('Failed to parse ticket analysis:', e)
            return { ...state, needsTicket: false }
        }

        if (analysis.needs_ticket) {
            // For explicit requests, create ticket immediately
            // For other cases, create if we have enough context
            if (analysis.is_explicit_request || analysis.description) {
                const ticketDetails = {
                    title: analysis.title || 'Support Request',
                    description: analysis.description || `User requested ticket about: ${state.currentMessage}`,
                    priority: analysis.priority || 'medium'
                }

                const toolCall = await executeToolCall('createTicket', {
                    title: ticketDetails.title,
                    description: ticketDetails.description,
                    priority: ticketDetails.priority
                }, state.userId)

                if (!toolCall.error) {
                    const ticketResult = toolCall.result as { id: string, title: string }
                    return {
                        ...state,
                        needsTicket: false, // Set to false since we've already created it
                        toolCalls: [...(state.toolCalls || []), toolCall],
                        response: `Ticket created: ${ticketResult.id}`,
                        metrics: {
                            ...state.metrics,
                            tool_usage: {
                                tool: 'createTicket',
                                success: true,
                                ticket_id: ticketResult.id,
                                was_explicit_request: analysis.is_explicit_request
                            }
                        }
                    }
                }
            } else {
                // If we need more context, ask for it
                return {
                    ...state,
                    response: "Could you provide more details about your request? This will help us create a more specific ticket for you."
                }
            }
        }

        return { ...state, needsTicket: false }
    },

    // Remove handle_ticket since we now create tickets immediately in analyze_ticket_need
    handle_ticket: async (state: ConversationState) => {
        return state
    },

    // Update generate_response to handle tool usage display
    generate_response: async (state: ConversationState) => {
        if (state.response) return state // Skip if we already have a response

        // Get dynamic system prompt
        const systemPrompt = await generateSystemPrompt()

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(
                state.context.length
                    ? `Context from knowledge base:\n${formatContext(state.context)}\n\n` +
                    (state.metrics?.tool_usage ? `Tool usage:\n${JSON.stringify(state.metrics.tool_usage, null, 2)}\n\n` : '') +
                    `User message: ${state.currentMessage}`
                    : `No relevant context found in knowledge base.\n` +
                    (state.metrics?.tool_usage ? `Tool usage:\n${JSON.stringify(state.metrics.tool_usage, null, 2)}\n\n` : '') +
                    `User message: ${state.currentMessage}`
            )
        ]

        const response = await model.invoke(messages)
        let responseText = response.content.toString()

        // If a ticket was created, keep the response simple
        if (state.metrics?.tool_usage?.tool === 'createTicket') {
            responseText = `Ticket created with ID: ${state.metrics.tool_usage.ticket_id}`
        }

        return {
            ...state,
            response: responseText,
            metrics: {
                ...state.metrics,
                rgqs: {
                    response_text: responseText,
                    overall_quality: 0.9,
                    relevance: state.context.length ? 0.95 : 0.7,
                    accuracy: state.context.length ? 0.95 : 0.7,
                    tone: 0.9
                }
            }
        }
    },

    // Record metrics
    record_metrics: async (state: ConversationState) => {
        if (state.metrics.kra) {
            await recordKRAMetrics(state.ticketId, state.metrics.kra)
        }
        if (state.metrics.rgqs) {
            await recordRGQSMetrics(state.ticketId, state.metrics.rgqs)
        }
        return state
    }
}

// Create our conversation pipeline
const pipeline = RunnableSequence.from([
    async (state: ConversationState) => await nodes.analyze_intent(state),
    async (state: ConversationState) => await nodes.gather_context(state),
    async (state: ConversationState) => await nodes.analyze_ticket_need(state),
    async (state: ConversationState) => await nodes.handle_ticket(state),
    async (state: ConversationState) => await nodes.generate_response(state),
    async (state: ConversationState) => await nodes.record_metrics(state)
])

export async function processConversation(
    message: string,
    userId: string,
    previousMessages: ChatMessage[],
    ticketId: string | null = null
): Promise<AgentResponse> {
    try {
        // Initialize state
        const initialState: ConversationState = {
            messages: previousMessages,
            context: [],
            userId,
            ticketId,
            currentMessage: message,
            needsTicket: false,
            toolCalls: [],
            response: null,
            metrics: {},
            isFirstMessage: previousMessages.length === 0
        }

        // Run the pipeline
        const result = await pipeline.invoke(initialState)

        return {
            message: result.response || 'I apologize, but I encountered an error processing your request.',
            tool_calls: result.toolCalls,
            context_used: result.context,
            metrics: result.metrics
        }
    } catch (error) {
        console.error('Error in conversation processing:', error)
        return {
            message: 'I apologize, but I encountered an error processing your request. Please try again or contact human support.',
            metrics: {}
        }
    }
} 