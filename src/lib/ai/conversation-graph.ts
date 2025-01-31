import { ChatMessage } from '@/types/chat'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { AgentAction, AgentResponse, RAGContext } from './agent-interfaces'
import { searchKnowledge, formatContext } from './rag'
import { executeToolCall, createAuthClient } from './tools'
import { recordKRAMetrics, recordRGQSMetrics } from './metrics'
import { SYSTEM_PROMPT, generateSystemPrompt } from './prompts'
import { Json } from '@/types/database'

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
    shouldResolve?: boolean
    resolutionDetails?: {
        resolution: string
        satisfaction_level: 'satisfied' | 'partially_satisfied' | 'unsatisfied'
    }
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

        // Analyze ticket priority based on content
        const determinePriority = (content: string): 'low' | 'medium' | 'high' | 'urgent' => {
            const urgentKeywords = ['broken', 'not working', 'error', 'urgent', 'emergency', 'critical', 'stopped working', 'strange noise'];
            const highKeywords = ['problem', 'issue', 'fail', 'malfunction'];
            const lowKeywords = ['question', 'how to', 'help with', 'guidance'];

            content = content.toLowerCase();

            if (urgentKeywords.some(keyword => content.includes(keyword))) return 'urgent';
            if (highKeywords.some(keyword => content.includes(keyword))) return 'high';
            if (lowKeywords.some(keyword => content.includes(keyword))) return 'low';
            return 'medium';
        };

        // Handle ticket creation
        if (analysis.tool === 'createTicket' && analysis.ticket_details) {
            const startTime = Date.now()
            try {
                // Create authenticated Supabase client
                const supabase = createAuthClient(state.userId)

                // Determine priority if not explicitly set
                const priority = analysis.ticket_details.priority ||
                    determinePriority(analysis.ticket_details.description);

                // Create ticket directly using Supabase client
                const { data: ticket, error: ticketError } = await supabase
                    .from('tickets')
                    .insert({
                        title: analysis.ticket_details.title,
                        description: analysis.ticket_details.description,
                        priority: priority,
                        created_by: state.userId,
                        ai_handled: true,
                        status: 'open',
                        metadata: {
                            source: 'ai_agent',
                            initial_query: state.messages[0]?.content
                        }
                    })
                    .select()
                    .single()

                if (ticketError) {
                    console.error('Failed to create ticket:', ticketError)
                    throw ticketError
                }

                const toolCall = {
                    id: `ticket-${Date.now()}`,
                    name: 'createTicket',
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date().toISOString(),
                    result: {
                        id: ticket.id,
                        title: ticket.title,
                        status: ticket.status,
                        priority: ticket.priority
                    }
                }

                return {
                    ...state,
                    toolCalls: [...(state.toolCalls || []), toolCall],
                    response: `I've created a support ticket for your issue. Your ticket ID is ${ticket.id}. A support representative will review your case and get back to you soon.`,
                    metrics: {
                        ...state.metrics,
                        tool_usage: {
                            tool: 'createTicket',
                            success: true,
                            ticket_id: ticket.id,
                            execution_time_ms: Date.now() - startTime,
                            priority: priority
                        },
                        pii: piiMetrics
                    }
                }
            } catch (error) {
                console.error('Failed to create ticket:', error)
                const toolCall = {
                    id: `ticket-${Date.now()}`,
                    name: 'createTicket',
                    start_time: new Date(startTime).toISOString(),
                    end_time: new Date().toISOString(),
                    error
                }

                let errorMessage = "I apologize, but I'm currently experiencing technical difficulties creating a ticket. Please try again in a few moments or contact our support team directly."

                // Check for specific error types
                if (error instanceof Error) {
                    if (error.message.includes('Missing required environment variables')) {
                        errorMessage = "I apologize, but the ticket creation system is not properly configured. Please contact the system administrator."
                        console.error('Environment variables missing for ticket creation:', error.message)
                    } else if (error.message.includes('JWSError')) {
                        errorMessage = "I apologize, but there seems to be an authentication issue. Please try logging out and back in, or contact support if the issue persists."
                        console.error('Authentication error during ticket creation:', error.message)
                    }
                }

                return {
                    ...state,
                    toolCalls: [...(state.toolCalls || []), toolCall],
                    response: errorMessage,
                    metrics: {
                        ...state.metrics,
                        tool_usage: {
                            tool: 'createTicket',
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            execution_time_ms: Date.now() - startTime
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

        // If no context was found, create a ticket suggestion response
        if (!state.context.length) {
            return {
                ...state,
                response: "I don't have any information about that in my knowledge base. Would you like me to create a support ticket to help you with your question?",
                metrics: {
                    ...state.metrics,
                    rgqs: {
                        response_text: "I don't have any information about that in my knowledge base. Would you like me to create a support ticket to help you with your question?",
                        overall_quality: 1, // Perfect adherence to protocol
                        relevance: 1, // Perfectly relevant response for no-context
                        accuracy: 1, // Accurate admission of no knowledge
                        tone: 1 // Professional and helpful tone
                    }
                }
            }
        }

        const messages = [
            new SystemMessage(
                `${systemPrompt}\n\nCRITICAL INSTRUCTION: You MUST ONLY use information from the provided knowledge base context. If the context doesn't contain information to fully answer the question, acknowledge the limitations of what you know and suggest creating a ticket.\n\nResponse Guidelines:
                1. Be concise and natural - use 1-2 sentences for simple answers
                2. Only use information explicitly stated in the context
                3. End with a focused follow-up question
                4. No bullet points or lists unless explicitly requested`
            ),
            new HumanMessage(
                `Context from knowledge base:\n${formatContext(state.context)}\n\n` +
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

    // Check if conversation should be resolved
    check_resolution: async (state: ConversationState) => {
        // Skip resolution check if chat is already closed
        if (state.response === "Chat closed. Thanks for using AutoCRM!") {
            return state
        }

        // Don't check resolution if we don't have a response yet
        if (!state.response) {
            return state
        }

        // Check for simple confirmations like "no that's it" or "that's all"
        const simpleConfirmation = /^(no )?th?ats? ?(it|all|good|fine)|^(no,? )?(?:im|i'?m|i am) (?:good|done|finished)|^no,? ?thanks?$/i.test(state.currentMessage.trim())

        if (simpleConfirmation && !state.resolutionDetails) {
            state = {
                ...state,
                resolutionDetails: {
                    resolution: "User confirmed their questions were answered",
                    satisfaction_level: "satisfied"
                }
            }
        }

        // First, check for user confirmation to resolve
        if (state.currentMessage && state.resolutionDetails) {
            const confirmationMessages = [
                new SystemMessage(
                    `Analyze if this message is confirming that the chat can be resolved.
                    Look for:
                    - Positive responses ("yes", "sure", "okay", etc.)
                    - Acknowledgments ("that's all", "we're done", etc.)
                    - Gratitude ("thanks, bye", "thank you, that's all", etc.)
                    
                    RESPONSE FORMAT:
                    {
                        "is_confirming": boolean,
                        "confidence": number
                    }`
                ),
                new HumanMessage(`User message: ${state.currentMessage}`)
            ]

            const confirmationAnalysis = await model.invoke(confirmationMessages)
            try {
                const content = confirmationAnalysis.content.toString()
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim()
                const confirmation = JSON.parse(content)

                if (confirmation.is_confirming && confirmation.confidence >= 0.8) {
                    console.log('✅ User confirmed resolution:', {
                        message: state.currentMessage,
                        confidence: confirmation.confidence
                    })

                    // Save chat messages before resolving
                    const supabase = createAuthClient(state.userId)

                    // Get or create active chat
                    const { data: chats, error: chatError } = await supabase
                        .from('chats')
                        .select('id')
                        .eq('user_id', state.userId)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1)

                    if (chatError) {
                        console.error('❌ Error finding active chat:', chatError)
                        throw chatError
                    }

                    let chatId
                    if (!chats || chats.length === 0) {
                        // Create new chat if none exists
                        const { data: newChat, error: createError } = await supabase
                            .from('chats')
                            .insert({
                                user_id: state.userId,
                                status: 'active',
                                metadata: {
                                    source: 'conversation_graph',
                                    message_count: state.messages.length
                                }
                            })
                            .select()
                            .single()

                        if (createError) {
                            console.error('❌ Error creating chat:', createError)
                            throw createError
                        }
                        chatId = newChat.id
                    } else {
                        chatId = chats[0].id
                    }

                    // Save all messages
                    const { error: messagesError } = await supabase
                        .from('chat_messages')
                        .insert(
                            state.messages.map(msg => ({
                                chat_id: chatId,
                                content: msg.content,
                                sender_id: state.userId,
                                is_ai: msg.role === 'assistant',
                                tool_calls: msg.tool_calls ? msg.tool_calls.map(tc => ({
                                    id: tc.id,
                                    name: tc.name,
                                    args: tc.args,
                                    result: tc.result,
                                    error: tc.error,
                                    startTime: tc.startTime,
                                    endTime: tc.endTime
                                } as Json)) : [],
                                context_used: msg.context_used || {},
                                metrics: msg.metrics || {},
                                metadata: {
                                    timestamp: msg.timestamp,
                                    role: msg.role
                                }
                            }))
                        )

                    if (messagesError) {
                        console.error('❌ Error saving messages:', messagesError)
                        throw messagesError
                    }

                    // Execute resolveChat tool
                    const toolCall = await executeToolCall('resolveChat', {
                        resolution: state.resolutionDetails.resolution,
                        satisfaction_level: state.resolutionDetails.satisfaction_level
                    }, state.userId)

                    if (!toolCall.error) {
                        console.log('✅ Successfully resolved chat:', {
                            tool_call_id: toolCall.id,
                            result: toolCall.result
                        })

                        return {
                            ...state,
                            response: "Chat closed. Thanks for using AutoCRM!",
                            toolCalls: [...(state.toolCalls || []), toolCall]
                        }
                    }
                }
            } catch (e) {
                console.error('❌ Failed to parse resolution analysis or save data:', e)
            }
        }

        return state
    },

    // Remove handle_resolution node since we now handle it in check_resolution
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
    // Check resolution first, before any other operations
    async (state: ConversationState) => {
        // Check for conversation endings, including:
        // 1. Simple acknowledgments with closure
        // 2. Direct "no" responses to follow-up questions
        // 3. Gratitude with closure
        // 4. Explicit conversation endings
        const closurePatterns = {
            gratitudeClosure: /^(thanks?|thank you|thx).*?(that'?s? ?(all|it)|good(bye)?|bye|done|finished|solved|helped?)\.?$/i,
            simpleNo: /^no[,.]? ?(thanks?|that'?s? ?(all|it)|good(bye)?|bye)?\.?$/i,
            acknowledgment: /^(that'?s? ?(all|it)|good(bye)?|bye|done|finished|solved|helped?)\.?$/i,
            solved: /^(yes|yeah|yep|that|this|it).*?(solved|fixed|helped|worked).*?(problem|it|issue)?\.?$/i
        };

        // Check if this is a response to a follow-up question
        const isFollowUpResponse = state.messages.length > 0 &&
            (state.messages[state.messages.length - 1].role === 'assistant' &&
                (state.messages[state.messages.length - 1].content.toLowerCase().includes('would you like') ||
                    state.messages[state.messages.length - 1].content.toLowerCase().includes('anything else')));

        const message = state.currentMessage.trim().toLowerCase();

        // Check against closure patterns
        const isClosing = Object.entries(closurePatterns).some(([type, pattern]) => {
            const matches = pattern.test(message);
            if (matches) {
                console.log(`✅ Detected conversation closure: ${type}`);
                return true;
            }
            return false;
        });

        if (isClosing || (isFollowUpResponse && /^no\.?$/i.test(message))) {
            return {
                ...state,
                response: "Thanks for using AutoCRM! Have a great day!",
                shouldResolve: true,
                resolutionDetails: {
                    resolution: "User indicated conversation completion",
                    satisfaction_level: "satisfied"
                }
            };
        }

        return state;
    },
    async (state: ConversationState) => state.response ? state : await nodes.handle_greeting(state),
    async (state: ConversationState) => state.response ? state : await nodes.decide_tool(state),
    async (state: ConversationState) => state.response ? state : await nodes.generate_response(state),
    async (state: ConversationState) => await nodes.check_resolution(state),
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
            isFirstMessage: previousMessages.length === 0,
            shouldResolve: false
        }

        // Check if last message indicated resolution
        const lastMessage = previousMessages[previousMessages.length - 1]
        if (lastMessage?.role === 'assistant' && lastMessage.content === "Chat closed. Thanks for using AutoCRM!") {
            return {
                message: '',  // Empty message to prevent further responses
                metrics: {}
            }
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