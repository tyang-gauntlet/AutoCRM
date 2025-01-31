import { ChatMessage } from '@/types/chat'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { AgentResponse, RAGContext } from './agent-interfaces'
import { searchKnowledge, formatContext } from './rag'
import { executeToolCall } from './tools'
import { recordKRAMetrics, recordRGQSMetrics } from './metrics'
import { generateSystemPrompt } from './prompts'

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
    intent?: 'greeting' | 'question' | 'affirmative' | 'unknown' | 'ticket_request'
    isFirstMessage?: boolean
}

// Initialize LLM
const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000
})

// Helper function to create a ticket with consistent behavior
const createTicketWithResponse = async (
    state: ConversationState,
    topic: string,
    originalMessage: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    description?: string
) => {
    const ticketDetails = {
        title: `Support Request: ${topic}`,
        description: description || `User requested assistance regarding: ${topic}\n\nOriginal request: "${originalMessage}"`,
        priority
    }

    const toolCall = await executeToolCall('createTicket', ticketDetails, state.userId)

    if (!toolCall.error) {
        const ticketResult = toolCall.result as { id: string, title: string }
        return {
            ...state,
            intent: 'ticket_request',
            needsTicket: false,
            toolCalls: [toolCall],
            response: `I've created a ticket about ${topic} (ID: ${ticketResult.id}). A support agent will review your request and get back to you soon. Is there anything else you'd like me to help you with?`,
            metrics: {
                tool_usage: {
                    tool: 'createTicket',
                    success: true,
                    ticket_id: ticketResult.id,
                    was_explicit_request: true,
                    topic,
                    priority
                }
            }
        }
    }
    return null
}

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

        // Clean the message by removing any tool names that might have been echoed
        const cleanMessage = state.currentMessage.replace(/^createTicket\s*$/i, '').trim()

        // If message is empty after cleaning, skip processing
        if (!cleanMessage) {
            return {
                ...state,
                intent: 'unknown',
                response: "I'm not sure what you'd like me to do. Could you please rephrase your request?"
            }
        }

        // Check for direct ticket creation requests first
        const ticketRequestMatch = cleanMessage.match(/\b(create|make|open|submit|raise)\s+(?:a\s+)?ticket\s+(?:about|for|on)?\s+(.+)/i)
        if (ticketRequestMatch) {
            const topic = ticketRequestMatch[2].trim()
            const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'important']
            const isPriority = urgentKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))
            const result = await createTicketWithResponse(state, topic, cleanMessage, isPriority ? 'high' : 'medium')
            if (result) return result
        }

        // Check for affirmative responses to ticket creation offers
        const isAffirmative = /^(yes|yeah|sure|ok|okay|yep|y)$/i.test(cleanMessage)
        const lastAssistantMessage = state.messages
            .filter(msg => msg.role === 'assistant')
            .pop()
        const wasOfferingTicket = lastAssistantMessage?.content.includes("Would you like to create a support ticket")

        if (isAffirmative && wasOfferingTicket) {
            // Get the user's previous message for context
            const previousUserMessage = state.messages
                .filter(msg => msg.role === 'user')
                .slice(-2)[0]  // Get the message before the "yes"

            if (previousUserMessage) {
                const topic = previousUserMessage.content.trim()
                const result = await createTicketWithResponse(state, topic, previousUserMessage.content)
                if (result) return result
            }
        }

        // Check for greetings
        const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))$/i.test(cleanMessage)

        return {
            ...state,
            intent: isGreeting ? 'greeting' : isAffirmative ? 'affirmative' : 'question'
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
        // Skip if we already have a response or if this is a greeting
        if (state.intent === 'greeting' || state.response || state.intent === 'ticket_request') {
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
                // Scrub PII from content
                piiMetrics.scrubbed_content = piiMetrics.scrubbed_content.replace(pattern, `[REDACTED_${type.toUpperCase()}]`)
            }
        }

        // Skip ticket analysis if we already have a ticket or response
        if (state.toolCalls?.some(call => call.name === 'createTicket')) {
            return {
                ...state,
                needsTicket: false,
                metrics: {
                    ...state.metrics,
                    pii: piiMetrics
                }
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
            // For explicit requests, create ticket immediately
            // For other cases, create if we have enough context
            if (analysis.is_explicit_request || analysis.description) {
                const result = await createTicketWithResponse(
                    state,
                    analysis.title || piiMetrics.scrubbed_content,
                    piiMetrics.scrubbed_content,
                    analysis.priority || (analysis.is_explicit_request ? 'high' : 'medium'),
                    analysis.description
                )
                if (result) return result
            } else {
                // If we need more context, ask for it
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

        // Calculate RGQS metrics
        const calculateOverallQuality = (text: string): number => {
            // Basic quality checks
            const hasGreeting = /^(hi|hello|hey|greetings)/i.test(text)
            const hasPunctuation = /[.!?]/.test(text)
            const hasProperLength = text.length > 20 && text.length < 500
            const hasProperCasing = /[A-Z]/.test(text[0])

            return [hasGreeting, hasPunctuation, hasProperLength, hasProperCasing]
                .filter(Boolean).length / 4
        }

        const calculateRelevance = (text: string, context: RAGContext[]): number => {
            if (!context.length) return 0.7 // Base relevance for no-context responses

            // Use highest similarity score as base relevance
            const baseRelevance = Math.max(...context.map(c => c.similarity))

            // Adjust based on response using context keywords
            const contextKeywords = context
                .flatMap(c => c.content.toLowerCase().split(/\W+/))
                .filter(word => word.length > 3)
            const responseWords = text.toLowerCase().split(/\W+/)
            const keywordMatches = contextKeywords
                .filter(keyword => responseWords.includes(keyword)).length

            return Math.min(1, baseRelevance + (keywordMatches * 0.1))
        }

        const calculateAccuracy = (context: RAGContext[]): number => {
            if (!context.length) return 0.7 // Base accuracy for no-context responses
            return Math.max(...context.map(c => c.similarity))
        }

        const calculateTone = (text: string): number => {
            // Check for professional tone markers
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
    async (state: ConversationState) => {
        // Skip further processing if we already have a response (e.g. from ticket creation)
        if (state.response || state.intent === 'ticket_request' || state.toolCalls?.some(call => call.name === 'createTicket')) {
            return state
        }
        return await nodes.gather_context(state)
    },
    async (state: ConversationState) => {
        // Skip ticket analysis if we already have a response or it's a ticket request
        if (state.response || state.intent === 'ticket_request' || state.toolCalls?.some(call => call.name === 'createTicket')) {
            return state
        }
        return await nodes.analyze_ticket_need(state)
    },
    async (state: ConversationState) => {
        // Skip response generation if we already have a response
        if (state.response || state.toolCalls?.some(call => call.name === 'createTicket')) {
            return state
        }
        return await nodes.generate_response(state)
    },
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