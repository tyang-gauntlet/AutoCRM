import { ChatMessage } from '@/types/chat'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { Client } from 'langsmith'
import { v4 as uuidv4 } from 'uuid'
import { AgentResponse, RAGContext } from '../ai/agent-interfaces'
import { searchKnowledge, formatContext } from '../ai/rag'
import { executeToolCall } from '../ai/tools'
import { generateSystemPrompt } from '../ai/prompts'
import { recordKRAMetrics, recordRGQSMetrics } from './metrics'
import { RunnableSequence } from '@langchain/core/runnables'
import { traceConversation, traceRAGOperation, traceToolExecution } from '../langsmith/tracing'

// Initialize LangSmith client
const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

// Initialize LLM with tracing config
const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE_URL,
    }
})

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
        pii?: {
            has_pii: boolean
            pii_types: string[]
            scrubbed_content: string
        }
    }
    ticketDetails?: {
        title: string
        description: string
        priority: string
    }
    intent?: 'greeting' | 'question' | 'affirmative' | 'unknown'
    isFirstMessage?: boolean
    runId?: string
    skipKnowledgeSearch?: boolean
    pendingTicketContext?: {
        query: string
        timestamp: string
    }
}

// Create our conversation pipeline
const pipeline = RunnableSequence.from([
    // Analyze intent
    async (state: ConversationState) => {
        try {
            // If this is the first message and no previous messages, return initial greeting
            if (state.isFirstMessage && state.messages.length === 0) {
                return {
                    ...state,
                    intent: 'greeting',
                    response: "👋 Hello! I'm your AutoCRM AI assistant. How can I help you today?",
                    skipKnowledgeSearch: true
                }
            }

            // Check for greetings
            const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))$/i.test(state.currentMessage.trim())

            // Check for affirmative responses
            const isAffirmative = /^(yes|yeah|sure|ok|okay|yep|y)$/i.test(state.currentMessage.trim())
            const lastAssistantMessage = state.messages
                .filter(msg => msg.role === 'assistant')
                .pop()
            const wasOfferingTicket = lastAssistantMessage?.content.includes('Would you like to create a support ticket')

            // Get the previous user query that led to the ticket offer
            const previousUserMessage = state.messages
                .filter(msg => msg.role === 'user')
                .slice(-2)[0]

            // If this is a "yes" to a ticket creation offer, create the ticket
            if (isAffirmative && wasOfferingTicket && previousUserMessage) {
                const toolCall = await executeToolCall('createTicket', {
                    title: 'Support Request: ' + previousUserMessage.content.slice(0, 50) + '...',
                    description: `User requested information about: ${previousUserMessage.content}\n\nNo relevant information found in knowledge base.`,
                    priority: 'medium'
                }, state.userId)

                if (!toolCall.error) {
                    const ticketResult = toolCall.result as { id: string, title: string }
                    return {
                        ...state,
                        intent: 'affirmative',
                        needsTicket: false,
                        toolCalls: [...(state.toolCalls || []), toolCall],
                        response: `I've created a ticket for your question about "${previousUserMessage.content}" (ID: ${ticketResult.id}). A support agent will review your request and get back to you soon.`,
                        skipKnowledgeSearch: true,
                        metrics: {
                            ...state.metrics,
                            tool_usage: {
                                tool: 'createTicket',
                                success: true,
                                ticket_id: ticketResult.id,
                                was_explicit_request: false,
                                original_query: previousUserMessage.content
                            }
                        }
                    }
                }
            }

            // If no knowledge found and not already offering a ticket, store the query for context
            if (!state.context.length && !wasOfferingTicket && !isGreeting && !isAffirmative) {
                return {
                    ...state,
                    intent: 'question',
                    pendingTicketContext: {
                        query: state.currentMessage,
                        timestamp: new Date().toISOString()
                    }
                }
            }

            return {
                ...state,
                intent: isGreeting ? 'greeting'
                    : (isAffirmative && wasOfferingTicket) ? 'affirmative'
                        : 'question',
                skipKnowledgeSearch: isGreeting || (isAffirmative && wasOfferingTicket)
            }
        } catch (error) {
            console.error('Error in analyze_intent:', error)
            throw error
        }
    },

    // Analyze ticket need
    async (state: ConversationState) => {
        try {
            if (state.intent === 'greeting' || state.response) {
                return { ...state, needsTicket: false }
            }

            // Build conversation history for analysis
            const conversationHistory = state.messages.map(msg =>
                `${msg.role.toUpperCase()}: ${msg.content}`
            ).join('\n')

            // Check for PII in the conversation
            const piiMetrics = {
                has_pii: false,
                pii_types: [] as string[],
                scrubbed_content: state.currentMessage
            }

            // Basic PII detection patterns
            const piiPatterns = {
                email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
                phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
                ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
                credit_card: /\b\d{4}[-]?\d{4}[-]?\d{4}[-]?\d{4}\b/
            }

            // Check for PII
            for (const [type, pattern] of Object.entries(piiPatterns)) {
                if (pattern.test(state.currentMessage)) {
                    piiMetrics.has_pii = true
                    piiMetrics.pii_types.push(type)
                    piiMetrics.scrubbed_content = piiMetrics.scrubbed_content.replace(pattern, `[REDACTED_${type.toUpperCase()}]`)
                }
            }

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
                    `Current conversation:\n${conversationHistory}\n\nLatest message: ${piiMetrics.scrubbed_content}\n\n` +
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
                if (analysis.is_explicit_request || analysis.description) {
                    const ticketDetails = {
                        title: analysis.title || 'Support Request',
                        description: analysis.description || `User requested information about: ${piiMetrics.scrubbed_content}`,
                        priority: analysis.priority || 'medium'
                    }

                    const toolCall = await executeToolCall('createTicket', ticketDetails, state.userId)

                    if (!toolCall.error) {
                        const ticketResult = toolCall.result as { id: string, title: string }
                        return {
                            ...state,
                            needsTicket: false,
                            toolCalls: [...(state.toolCalls || []), toolCall],
                            response: `I've created a ticket for you (ID: ${ticketResult.id}). A support agent will review your request and get back to you soon.`,
                            metrics: {
                                ...state.metrics,
                                tool_usage: {
                                    tool: 'createTicket',
                                    success: true,
                                    ticket_id: ticketResult.id,
                                    was_explicit_request: analysis.is_explicit_request
                                },
                                pii: piiMetrics
                            }
                        }
                    }
                } else {
                    return {
                        ...state,
                        response: "Could you provide more details about your request? This will help us create a more specific ticket for you.",
                        metrics: {
                            ...state.metrics,
                            pii: piiMetrics
                        }
                    }
                }
            }

            return {
                ...state,
                needsTicket: false,
                metrics: {
                    ...state.metrics,
                    pii: piiMetrics
                }
            }
        } catch (error) {
            console.error('Error in analyze_ticket_need:', error)
            throw error
        }
    },

    // Gather context
    async (state: ConversationState) => {
        try {
            // Skip context gathering for greetings, existing responses, or when explicitly skipped
            if (state.intent === 'greeting' || state.response || state.skipKnowledgeSearch) {
                return {
                    ...state,
                    context: [], // Ensure context is empty when skipping search
                    metrics: {
                        ...state.metrics,
                        kra: {
                            query_text: state.currentMessage,
                            retrieved_chunks: 0,
                            relevant_chunks: 0,
                            accuracy: 0,
                            relevance_score: 0,
                            context_match: 0
                        }
                    }
                }
            }

            const context = await traceRAGOperation(
                'gather_context',
                {
                    userId: state.userId,
                    ticketId: state.ticketId,
                    messageId: state.currentMessage,
                    conversationId: state.messages[0]?.id
                },
                state.currentMessage,
                () => searchKnowledge(state.currentMessage),
                state.runId
            )

            const relevantThreshold = 0.7

            // Calculate metrics
            const kra = {
                query_text: state.currentMessage,
                retrieved_chunks: context.length,
                relevant_chunks: context.filter(c => c.similarity > relevantThreshold).length,
                accuracy: Math.max(...context.map(c => c.similarity), 0),
                relevance_score: context.length ?
                    context.reduce((acc, c) => acc + c.similarity, 0) / context.length :
                    0,
                context_match: context.length > 0 ? 1 : 0
            }

            // If no relevant context found and we have a pending query, offer to create a ticket
            if (context.length === 0 && state.pendingTicketContext) {
                return {
                    ...state,
                    context,
                    metrics: {
                        ...state.metrics,
                        kra
                    },
                    response: `I don't have any information about that in my knowledge base. Would you like to create a support ticket to get help with your question?`,
                    needsTicket: true
                }
            }

            return {
                ...state,
                context,
                metrics: {
                    ...state.metrics,
                    kra
                }
            }
        } catch (error) {
            console.error('Error in gather_context:', error)
            throw error
        }
    },

    // Generate response
    async (state: ConversationState) => {
        try {
            if (state.response) {
                return state
            }

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

            // Calculate RGQS metrics
            const calculateOverallQuality = (text: string): number => {
                const hasGreeting = /^(hi|hello|hey|greetings)/i.test(text)
                const hasPunctuation = /[.!?]/.test(text)
                const hasProperLength = text.length > 20 && text.length < 500
                const hasProperCasing = /[A-Z]/.test(text[0])

                return [hasGreeting, hasPunctuation, hasProperLength, hasProperCasing]
                    .filter(Boolean).length / 4
            }

            const calculateRelevance = (text: string, context: RAGContext[]): number => {
                if (!context.length) return 0.7

                const baseRelevance = Math.max(...context.map(c => c.similarity))

                const contextKeywords = context
                    .flatMap(c => c.content.toLowerCase().split(/\W+/))
                    .filter(word => word.length > 3)
                const responseWords = text.toLowerCase().split(/\W+/)
                const keywordMatches = contextKeywords
                    .filter(keyword => responseWords.includes(keyword)).length

                return Math.min(1, baseRelevance + (keywordMatches * 0.1))
            }

            const calculateAccuracy = (context: RAGContext[]): number => {
                if (!context.length) return 0.7
                return Math.max(...context.map(c => c.similarity))
            }

            const calculateTone = (text: string): number => {
                const hasPoliteWords = /(please|thank|appreciate|assist)/i.test(text)
                const noSlang = !/(gonna|wanna|dunno|yeah)/i.test(text)
                const formalStructure = /^[A-Z].*[.!?]$/.test(text)
                const appropriateLength = text.length > 10

                return [hasPoliteWords, noSlang, formalStructure, appropriateLength]
                    .filter(Boolean).length / 4
            }

            return {
                ...state,
                response: responseText,
                metrics: {
                    ...state.metrics,
                    rgqs: {
                        response_text: responseText,
                        overall_quality: calculateOverallQuality(responseText),
                        relevance: calculateRelevance(responseText, state.context),
                        accuracy: calculateAccuracy(state.context),
                        tone: calculateTone(responseText)
                    }
                }
            }
        } catch (error) {
            console.error('Error in generate_response:', error)
            throw error
        }
    }
])

export async function processConversation(
    message: string,
    userId: string,
    previousMessages: ChatMessage[],
    ticketId: string | null = null
): Promise<AgentResponse> {
    return traceConversation(
        'process_conversation',
        {
            userId,
            ticketId,
            messageId: message,
            conversationId: previousMessages[0]?.id
        },
        async () => {
            // Generate a unique run ID for the conversation
            const runId = uuidv4()

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
                isFirstMessage: previousMessages.length === 0,
                runId
            }

            // Run the pipeline
            const finalState = await pipeline.invoke(initialState)

            return {
                message: finalState.response || 'I apologize, but I encountered an error processing your request.',
                tool_calls: finalState.toolCalls,
                context_used: finalState.context,
                metrics: finalState.metrics
            }
        }
    ).catch(error => {
        console.error('Error in conversation processing:', error)
        return {
            message: 'I apologize, but I encountered an error processing your request. Please try again or contact human support.',
            metrics: {}
        }
    })
} 