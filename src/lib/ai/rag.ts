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
        // Generate embedding for query
        const queryEmbedding = await embeddings.embedQuery(query)

        // Search for similar documents
        const { data: results, error } = await supabase.rpc('match_kb_embeddings', {
            query_embedding: queryEmbedding,
            similarity_threshold: 0.8,
            match_count: limit
        })

        if (error) throw error

        // Format results
        return results.map(result => ({
            article_id: result.article_id,
            title: result.article_title,
            content: result.content,
            similarity: result.similarity
        }))
    } catch (error) {
        console.error('Error searching knowledge base:', error)
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