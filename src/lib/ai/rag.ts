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
        console.log('RAG Search - Starting search for query:', query)

        // First, check if we have any articles about this topic directly
        console.log('RAG Search - Checking for direct matches first')
        const { data: directMatches, error: directError } = await supabase
            .from('kb_articles')
            .select('id, title, content')
            .eq('status', 'published')
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(limit)

        if (directError) {
            console.error('RAG Search - Direct search error:', directError)
        } else {
            console.log('RAG Search - Direct matches found:', directMatches?.length || 0)
            if (directMatches?.length) {
                console.log('RAG Search - Direct match titles:', directMatches.map(m => m.title))
            }
        }

        // Generate embedding for query
        console.log('RAG Search - Generating embedding for query')
        const queryEmbedding = await embeddings.embedQuery(query)
        console.log('RAG Search - Embedding generated, length:', queryEmbedding.length)

        // Verify embedding format
        if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
            console.error('RAG Search - Invalid embedding format:', {
                isArray: Array.isArray(queryEmbedding),
                length: queryEmbedding?.length
            })
            throw new Error(`Invalid embedding format: expected array of 1536 numbers, got ${typeof queryEmbedding} of length ${queryEmbedding?.length}`)
        }

        // Check if we have any embeddings in the database
        console.log('RAG Search - Checking for existing embeddings')
        const { count: embeddingCount, error: countError } = await supabase
            .from('kb_embeddings')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('RAG Search - Error checking embeddings count:', countError)
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

            // Check a sample embedding
            const { data: sampleEmbedding, error: sampleError } = await supabase
                .from('kb_embeddings')
                .select('embedding')
                .limit(1)
                .single()

            if (sampleError) {
                console.error('RAG Search - Error checking sample embedding:', sampleError)
            } else {
                console.log('RAG Search - Sample embedding type:', typeof sampleEmbedding?.embedding)
                console.log('RAG Search - Sample embedding:', sampleEmbedding?.embedding?.slice?.(0, 100))
            }
        }

        // Search for similar documents
        console.log('RAG Search - Executing vector similarity search')
        console.log('RAG Search - Query embedding sample:', queryEmbedding.slice(0, 5), '...')
        const { data: results, error } = await supabase.rpc('match_kb_embeddings', {
            query_embedding: queryEmbedding,  // Pass the raw array, Postgres will handle the conversion
            similarity_threshold: 0.5,  // Keep threshold at 0.5
            match_count: limit * 4  // Get more results to filter
        })

        if (error) {
            console.error('RAG Search - Vector search error:', error)
            // Check if it's a type conversion error
            if (error.message?.includes('vector')) {
                console.error('RAG Search - Vector conversion error. Embedding type:', typeof queryEmbedding)
                console.error('RAG Search - Embedding array?', Array.isArray(queryEmbedding))
                console.error('RAG Search - Embedding length:', queryEmbedding.length)
            }
            throw error
        }

        // Convert distances to similarities (smaller distance = higher similarity)
        const processedResults = results?.map(result => ({
            ...result,
            similarity: Math.exp(-result.similarity)  // Convert distance to similarity score between 0 and 1
        })) || []

        console.log('RAG Search - Vector search results:', {
            count: processedResults.length,
            results: processedResults.map(r => ({
                title: r.article_title,
                similarity: r.similarity
            }))
        })

        // If no vector search results, use direct search results
        if (!processedResults || processedResults.length === 0) {
            console.log('RAG Search - No vector matches, using direct matches')
            if (directMatches && directMatches.length > 0) {
                console.log('RAG Search - Returning direct matches')
                return directMatches.map(article => ({
                    article_id: article.id,
                    title: article.title,
                    content: article.content,
                    similarity: 0.8  // Default similarity for direct matches
                }))
            }
        }

        // Format and filter results
        const formattedResults = processedResults
            .filter(result => result.similarity > 0.3) // Lower threshold since we're using exponential scaling
            .map(result => ({
                article_id: result.article_id,
                title: result.article_title,
                content: result.content,
                similarity: result.similarity
            }))
            .slice(0, limit)

        console.log('RAG Search - Final results:', {
            count: formattedResults.length,
            results: formattedResults.map(r => ({
                title: r.title,
                similarity: r.similarity
            }))
        })

        return formattedResults
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