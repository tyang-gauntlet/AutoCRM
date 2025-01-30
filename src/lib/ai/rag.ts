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
        console.log('RAG Search - Query:', query)

        // Generate embedding for query
        const queryEmbedding = await embeddings.embedQuery(query)
        console.log('RAG Search - Embedding generated, length:', queryEmbedding.length)

        // First try with coffee-specific search
        if (query.toLowerCase().includes('coffee')) {
            console.log('RAG Search - Coffee-specific search')
            const { data: coffeeResults, error: coffeeError } = await supabase
                .from('kb_articles')
                .select('id, title')
                .ilike('title', '%coffee%')

            if (!coffeeError && coffeeResults?.length > 0) {
                console.log('RAG Search - Found coffee articles:', coffeeResults)
            }
        }

        // Verify embedding format
        if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
            throw new Error(`Invalid embedding format: expected array of 1536 numbers, got ${typeof queryEmbedding} of length ${queryEmbedding?.length}`)
        }

        // Search for similar documents with lower threshold for debugging
        const { data: results, error } = await supabase.rpc('match_kb_embeddings', {
            query_embedding: `[${queryEmbedding.join(',')}]`,  // Convert to Postgres vector format
            similarity_threshold: 0.5,  // Lower threshold for testing
            match_count: limit * 2  // Double limit for testing
        })

        if (error) {
            console.error('RAG Search - Error:', error)
            throw error
        }

        if (!results || results.length === 0) {
            // Fallback to direct article lookup for coffee-related queries
            if (query.toLowerCase().includes('coffee')) {
                const { data: articles, error: articlesError } = await supabase
                    .from('kb_articles')
                    .select(`
                        id,
                        title,
                        content,
                        kb_embeddings (
                            content,
                            embedding
                        )
                    `)
                    .ilike('title', '%coffee%')
                    .limit(limit)

                if (!articlesError && articles?.length > 0) {
                    return articles.map(article => ({
                        article_id: article.id,
                        title: article.title,
                        content: article.kb_embeddings?.[0]?.content || article.content,
                        similarity: 1.0  // Direct match
                    }))
                }
            }
        }

        console.log('RAG Search - Results:', results)

        // Format results
        const formattedResults = results?.map(result => ({
            article_id: result.article_id,
            title: result.article_title,
            content: result.content,
            similarity: result.similarity
        })) || []

        console.log('RAG Search - Formatted results:', formattedResults)
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