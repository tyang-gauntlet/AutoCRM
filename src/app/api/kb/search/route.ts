export const dynamic = 'force-dynamic'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAIEmbeddings } from "@langchain/openai"

const embeddings = new OpenAIEmbeddings()

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const threshold = parseFloat(searchParams.get('threshold') || '0.7')
        const limit = parseInt(searchParams.get('limit') || '5')

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter required' },
                { status: 400 }
            )
        }

        const supabase = createRouteHandlerClient({ cookies })

        // Generate embedding for search query
        const queryEmbedding = await embeddings.embedQuery(query)

        // Search using vector similarity
        const { data: chunks, error } = await supabase
            .rpc('match_kb_chunks', {
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: limit
            })

        if (error) throw error

        return NextResponse.json({ results: chunks })
    } catch (error) {
        console.error('Error searching knowledge base:', error)
        return NextResponse.json(
            { error: 'Error searching knowledge base' },
            { status: 500 }
        )
    }
} 