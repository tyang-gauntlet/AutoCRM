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
}

// Initialize LLM
const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000
})

// Create nodes for our conversation graph
const nodes = {
    // Start by analyzing intent and greeting if needed
    handle_greeting: async (state: ConversationState) => {
        // If this is the first message and no previous messages, return initial greeting
        if (state.isFirstMessage && state.messages.length === 0) {
            return {
                ...state,
                response: "👋 Hello! I'm your AutoCRM AI assistant. How can I help you today?"
            }
        }
        return state
    },

    // Analyze the message and decide which tool to use
    decide_tool: async (state: ConversationState) => {
        if (state.response) return state // Skip if we already have a response

        // Check for greetings
        const isGreeting = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))$/i.test(state.currentMessage.trim())
        if (isGreeting) {
            return {
                ...state,
                response: "Hello! How can I assist you today?"
            }
        }

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

        // Build conversation history for analysis
        const conversationHistory = state.messages.map(msg =>
            `${msg.role.toUpperCase()}: ${msg.content}`
        ).join('\n')

        // Create analysis prompt for tool decision
        const toolAnalysisMessages = [
            new SystemMessage(
                `You are a support tool analyzer. Your job is to determine which tool to use based on the conversation.
                
                IMPORTANT GUIDELINES:
                1. For ticket creation:
                   - Any direct request to create/make a ticket
                   - Specific issues or requests that need tracking
                   - Complex problems that need human review
                
                2. For knowledge base search:
                   - General questions about products/services
                   - How-to queries
                   - Documentation requests
                
                RESPONSE FORMAT:
                Respond with a raw JSON object only, no markdown formatting, no code blocks.
                The response must match this exact structure:
                {
                    "tool": "createTicket" | "searchKnowledge" | null,
                    "reason": string,
                    "ticket_details": {
                        "title": string,
                        "description": string,
                        "priority": "low" | "medium" | "high" | "urgent"
                    } | null
                }
                
                Example response:
                {"tool":"createTicket","reason":"User explicitly requested ticket creation","ticket_details":{"title":"Support Request","description":"User needs help with X","priority":"medium"}}`
            ),
            new HumanMessage(
                `Current conversation:\n${conversationHistory}\n\nLatest message: ${piiMetrics.scrubbed_content}\n\n` +
                `Determine which tool to use.`
            )
        ]

        const toolAnalysis = await model.invoke(toolAnalysisMessages)
        let analysis
        try {
            // Clean up the response to handle markdown formatting
            const content = toolAnalysis.content.toString()
                .replace(/```json\n?/g, '')  // Remove ```json
                .replace(/```\n?/g, '')      // Remove closing ```
                .trim()

            analysis = JSON.parse(content)

            // Validate the parsed response has the expected structure
            if (!analysis || typeof analysis !== 'object') {
                throw new Error('Invalid response structure')
            }

            if (!['createTicket', 'searchKnowledge', null].includes(analysis.tool)) {
                throw new Error(`Invalid tool specified: ${analysis.tool}`)
            }
        } catch (e) {
            console.error('Failed to parse tool analysis:', e, '\nRaw response:', toolAnalysis.content.toString())
            return {
                ...state,
                metrics: { ...state.metrics, pii: piiMetrics },
                response: "I apologize, but I encountered an error processing your request. Please try again."
            }
        }

        // Handle ticket creation
        if (analysis.tool === 'createTicket' && analysis.ticket_details) {
            const startTime = Date.now()
            const toolCall = await executeToolCall('createTicket', {
                title: analysis.ticket_details.title,
                description: analysis.ticket_details.description,
                priority: analysis.ticket_details.priority
            }, state.userId)
            const endTime = Date.now()

            if (!toolCall.error) {
                const ticketResult = toolCall.result as { id: string, title: string }
                return {
                    ...state,
                    toolCalls: [...(state.toolCalls || []), toolCall],
                    response: `Ticket created: ${ticketResult.id}`,
                    metrics: {
                        ...state.metrics,
                        tool_usage: {
                            tool: 'createTicket',
                            success: true,
                            ticket_id: ticketResult.id,
                            execution_time_ms: endTime - startTime,
                            priority: analysis.ticket_details.priority
                        },
                        pii: piiMetrics
                    }
                }
            }
        }

        // Handle knowledge search
        if (analysis.tool === 'searchKnowledge') {
            const startTime = Date.now()
            const context = await searchKnowledge(state.currentMessage)
            const endTime = Date.now()

            const relevantThreshold = 0.7 // Threshold for considering chunks relevant

            // Calculate KRA metrics
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

            const toolCall = {
                id: `rag-${Date.now()}`,
                name: 'searchKnowledge',
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                result: {
                    context_found: context.length,
                    top_similarity: kra.accuracy,
                    query: state.currentMessage,
                    sources: context.map(c => c.title || 'Untitled').filter(Boolean)
                }
            }

            return {
                ...state,
                context,
                toolCalls: [...(state.toolCalls || []), toolCall],
                metrics: {
                    ...state.metrics,
                    kra,
                    pii: piiMetrics
                }
            }
        }

        return {
            ...state,
            metrics: {
                ...state.metrics,
                pii: piiMetrics
            }
        }
    },

    // Generate response based on context and tool results
    generate_response: async (state: ConversationState) => {
        if (state.response) return state // Skip if we already have a response

        // Get dynamic system prompt
        const systemPrompt = await generateSystemPrompt()

        const messages = [
            new SystemMessage(
                `${systemPrompt}\n\nIMPORTANT: Keep responses concise and conversational. Avoid bullet points and lists. 
                Integrate information naturally into 2-3 sentences. For knowledge base results, briefly mention key topics 
                and ask a follow-up question about their specific interests.`
            ),
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
        const responseText = response.content.toString()

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
    async (state: ConversationState) => await nodes.handle_greeting(state),
    async (state: ConversationState) => await nodes.decide_tool(state),
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

        // Only include context_used if no searchKnowledge tool call exists
        const hasSearchKnowledge = result.toolCalls?.some(tc => tc.name === 'searchKnowledge')

        return {
            message: result.response || 'I apologize, but I encountered an error processing your request.',
            tool_calls: result.toolCalls,
            context_used: hasSearchKnowledge ? undefined : result.context,
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