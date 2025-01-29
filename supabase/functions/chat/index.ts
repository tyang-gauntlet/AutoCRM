// @ts-nocheck
import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { ChatOpenAI } from "langchain/chat_models/openai"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PromptTemplate } from "langchain/prompts"
import { LLMChain } from "langchain/chains"

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
}

function handleCors(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }
    return null
}

// Initialize OpenAI chat model
const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    verbose: false // Reduce memory usage
})

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    verbose: false // Reduce memory usage
})

// Initialize Supabase client
const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
        auth: {
            persistSession: false
        }
    }
)

// Create prompt template once
const promptTemplate = new PromptTemplate({
    template: `You are a helpful customer service AI assistant for GauntletAI. Use the following knowledge base context to answer the user's question. If you cannot find a relevant answer in the context, say so politely and suggest contacting human support.

If the user wants to close their ticket, respond affirmatively and include an action in your response with type 'close_ticket'.

Your responses should be:
1. Professional and courteous
2. Clear and concise
3. Accurate based on the provided context
4. Helpful in resolving the user's query

Knowledge Base Context:
{context}

User Question: {question}`,
    inputVariables: ["context", "question"]
})

// Create chain once
const chain = new LLMChain({
    llm: model,
    prompt: promptTemplate,
    verbose: false // Reduce memory usage
})

serve(async (req: Request) => {
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
        const { message, ticketId, traceId } = await req.json()

        if (!message) {
            throw new Error('Message is required')
        }

        // Generate embedding
        const queryEmbedding = await embeddings.embedQuery(message)

        // Search for relevant documents
        const { data: searchResults, error: searchError } = await supabaseClient.rpc(
            'match_kb_embeddings',
            {
                query_embedding: queryEmbedding,
                similarity_threshold: 0.8,
                match_count: 5
            }
        )

        if (searchError) throw searchError

        // Create context from search results
        const context = searchResults?.length
            ? searchResults.map(doc => `${doc.article_title}:\n${doc.content}`).join('\n\n')
            : 'No relevant knowledge base articles found.'

        // Generate response
        const response = await chain.call({
            context,
            question: message
        })

        // Calculate metrics
        const contextMetrics = {
            chunks: searchResults?.length ?? 0,
            relevant: searchResults?.filter(r => r.similarity > 0.85).length ?? 0,
            accuracy: searchResults?.[0]?.similarity ?? 0,
            relevance: searchResults?.reduce((acc, r) => acc + r.similarity, 0) / (searchResults?.length ?? 1),
            contextMatch: searchResults?.length ? 1 : 0
        }

        // Check for ticket closure intent
        const closeTicketRegex = /(?:close|resolve|complete|mark\s+(?:as\s+)?done).*ticket/i
        const actions = []

        if (closeTicketRegex.test(message.toLowerCase()) && ticketId) {
            actions.push({
                type: 'close_ticket',
                ticketId,
                reason: 'Closed via AI chat'
            })
        }

        const chatResponse = {
            message: response.text,
            context: contextMetrics,
            quality: {
                overall: 4.5,
                relevance: 4.5,
                accuracy: 4.5,
                tone: 4.5
            },
            ...(actions.length > 0 && { actions })
        }

        return new Response(
            JSON.stringify(chatResponse),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                stack: Deno.env.get('ENVIRONMENT') !== 'production' ? error.stack : undefined
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        )
    }
}) 