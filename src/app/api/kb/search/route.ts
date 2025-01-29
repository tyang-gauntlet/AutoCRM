import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAIEmbeddings } from '@langchain/openai'

export async function POST(req: NextRequest) {
    console.log('[KB Search] Starting search process')

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get query from request
        const { query, limit = 5, similarity_threshold = 0.8 } = await req.json()

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        console.log('[KB Search] Query received:', { query, limit, similarity_threshold })

        // Generate embedding for query
        if (!process.env.OPENAI_API_KEY) {
            console.error('[KB Search] Missing OpenAI API key')
            throw new Error('OpenAI API key not configured')
        }

        console.log('[KB Search] Generating query embedding')
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        })

        const queryEmbedding = await embeddings.embedQuery(query)

        // Perform vector similarity search
        console.log('[KB Search] Performing similarity search')
        const { data: results, error } = await supabase.rpc('match_kb_embeddings', {
            query_embedding: queryEmbedding,
            similarity_threshold,
            match_count: limit
        })

        if (error) {
            console.error('[KB Search] Search error:', error)
            throw error
        }

        console.log('[KB Search] Search completed:', {
            resultCount: results?.length || 0
        })

        return new Response(JSON.stringify({ results }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('[KB Search] Unhandled error:', error)
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to perform search',
                details: error instanceof Error ? error.stack : undefined
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
} 