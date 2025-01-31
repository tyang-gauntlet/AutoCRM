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

        // Get direct matches count
        const { count: directMatchCount, error: countError } = await supabase
            .from('kb_embeddings')
            .select('*', { count: 'exact', head: true })
            .textSearch('content', query)

        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query)
        if (!queryEmbedding) {
            throw new Error('Failed to generate query embedding')
        }

        // Check for existing embeddings
        const { count: embeddingCount, error: embeddingCountError } = await supabase
            .from('kb_embeddings')
            .select('*', { count: 'exact', head: true })

        if (embeddingCountError) {
            console.error('RAG Search - Error checking embeddings count:', embeddingCountError)
        }

        // Execute vector similarity search
        const params = {
            query_embedding: queryEmbedding,
            similarity_threshold: 0.1,  // Using a lower threshold to capture more matches
            match_count: limit
        }

        const { data: matches, error } = await supabase.rpc('match_kb_embeddings', params)

        if (error) {
            console.error('RAG Search - Vector search error:', error)
            throw error
        }

        if (!matches || matches.length === 0) {
            console.log('RAG Search - No matches found')
            return []
        }

        console.log('RAG Search - Results:', {
            matches_found: matches.length,
            top_similarity: matches[0]?.similarity,
            articles: matches.map(m => m.article_title)
        })

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