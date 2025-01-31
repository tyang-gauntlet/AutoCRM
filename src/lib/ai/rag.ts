import { OpenAIEmbeddings } from '@langchain/openai'
import { supabase } from '@/lib/supabase'
import { RAGContext } from './agent-interfaces'

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
    stripNewLines: true
})

export async function searchKnowledge(query: string, limit = 5): Promise<RAGContext[]> {
    try {
        // Check for direct matches first
        console.log('RAG Search - Starting search for query:', query)
        console.log('RAG Search - Checking for direct matches first')

        // Get direct matches count
        const { count: directMatchCount, error: countError } = await supabase
            .from('kb_embeddings')
            .select('*', { count: 'exact', head: true })
            .textSearch('content', query)

        console.log('RAG Search - Direct matches found:', directMatchCount)

        // Generate embedding for query
        console.log('RAG Search - Generating embedding for query')
        const queryEmbedding = await generateEmbedding(query)
        if (!queryEmbedding) {
            throw new Error('Failed to generate query embedding')
        }
        console.log('RAG Search - Embedding generated, length:', queryEmbedding.length)

        // Log query embedding details for debugging
        console.log('RAG Search - Query embedding sample:', queryEmbedding.slice(0, 5), '...')
        console.log('RAG Search - Query embedding details:', {
            type: typeof queryEmbedding,
            isArray: Array.isArray(queryEmbedding),
            length: queryEmbedding.length,
            sample: queryEmbedding.slice(0, 5),
            hasNaN: queryEmbedding.some(isNaN),
            min: Math.min(...queryEmbedding),
            max: Math.max(...queryEmbedding)
        })

        // Check for existing embeddings
        console.log('RAG Search - Checking for existing embeddings')
        const { count: embeddingCount, error: embeddingCountError } = await supabase
            .from('kb_embeddings')
            .select('*', { count: 'exact', head: true })

        if (embeddingCountError) {
            console.error('RAG Search - Error checking embeddings count:', embeddingCountError)
        } else {
            console.log('RAG Search - Total embeddings in database:', embeddingCount)

            // Check published articles
            const { data: articles, error: articlesError } = await supabase
                .from('kb_articles')
                .select('id, title, has_embeddings')
                .eq('status', 'published')

            if (articlesError) {
                console.error('RAG Search - Error checking articles:', articlesError)
            } else {
                console.log('RAG Search - Published articles:', articles?.map(a => ({
                    title: a.title,
                    has_embeddings: a.has_embeddings
                })))
            }
        }

        console.log('RAG Search - Executing vector similarity search')
        console.log('RAG Search - Query embedding type:', typeof queryEmbedding)
        console.log('RAG Search - Query embedding is array:', Array.isArray(queryEmbedding))
        console.log('RAG Search - Query embedding length:', queryEmbedding.length)
        console.log('RAG Search - Query embedding first 5 values:', queryEmbedding.slice(0, 5))

        // Log the exact parameters being sent to the function
        const params = {
            query_embedding: queryEmbedding,
            similarity_threshold: 0.1,  // Using a lower threshold to capture more matches
            match_count: limit
        }
        console.log('RAG Search - Function parameters:', JSON.stringify(params))

        const { data: matches, error } = await supabase.rpc('match_kb_embeddings', params)

        if (error) {
            console.error('RAG Search - Vector search error:', error)
            console.error('RAG Search - Error code:', error.code)
            console.error('RAG Search - Error message:', error.message)
            console.error('RAG Search - Error details:', error.details)
            throw error
        }

        if (!matches || matches.length === 0) {
            console.log('RAG Search - No matches found')
            // Debug: Check the first embedding in the database
            const { data: debugMatches, error: debugError } = await supabase
                .from('kb_embeddings')
                .select('id, content, article_id, embedding')
                .limit(1)

            if (debugMatches?.[0]) {
                const debugEmbedding = debugMatches[0].embedding
                console.log('RAG Search - Debug - First embedding metadata:', {
                    id: debugMatches[0].id,
                    content_preview: debugMatches[0].content.substring(0, 100),
                    embedding_length: Array.isArray(debugEmbedding) ? debugEmbedding.length : 0,
                    embedding_sample: Array.isArray(debugEmbedding) ? debugEmbedding.slice(0, 5) : []
                })

                // Calculate cosine similarity manually for debugging
                if (Array.isArray(debugEmbedding) && debugEmbedding.length === queryEmbedding.length) {
                    const dotProduct = queryEmbedding.reduce((sum: number, val: number, i: number) => sum + val * (debugEmbedding[i] as number), 0)
                    const queryMagnitude = Math.sqrt(queryEmbedding.reduce((sum: number, val: number) => sum + val * val, 0))
                    const embeddingMagnitude = Math.sqrt(debugEmbedding.reduce((sum: number, val: number) => sum + val * val, 0))
                    const cosineSimilarity = dotProduct / (queryMagnitude * embeddingMagnitude)
                    console.log('RAG Search - Debug - Manual cosine similarity with first embedding:', cosineSimilarity)
                }
            }
            console.log('RAG Search - Debug - Error:', debugError)
            return []
        }

        console.log('RAG Search - Matches found:', matches.length)
        console.log('RAG Search - Match details:', matches.map(m => ({
            title: m.article_title,
            similarity: m.similarity,
            url: m.article_url
        })))

        return matches.map(match => ({
            content: match.content,
            article_id: match.article_id,
            title: match.article_title,
            article_url: match.article_url,
            similarity: match.similarity
        }))

    } catch (error) {
        console.error('RAG Search - Critical error:', error)
        return []
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const embedding = await embeddings.embedQuery(text)
        return embedding
    } catch (error) {
        console.error('Error generating embedding:', error)
        throw error
    }
}

export function formatContext(contexts: RAGContext[]): string {
    return contexts
        .map(ctx => `Article: ${ctx.title}\n${ctx.content}`)
        .join('\n\n')
} 