import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAIEmbeddings } from "@langchain/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { Document } from "langchain/document"

interface ChunkDocument extends Document {
    pageContent: string;
}

const embeddings = new OpenAIEmbeddings()
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
})

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const json = await request.json()
        const { title, content, category_id, source_type = 'manual' } = json

        // Generate embedding for full article
        const embedding = await embeddings.embedQuery(content)

        // Split content into chunks
        const chunks = await splitter.createDocuments([content])
        const chunkEmbeddings = await Promise.all(
            chunks.map(async (chunk: ChunkDocument) => ({
                content: chunk.pageContent,
                embedding: await embeddings.embedQuery(chunk.pageContent)
            }))
        )

        // Start transaction
        const { data: article, error: articleError } = await supabase
            .from('kb_articles')
            .insert({
                title,
                content,
                category_id,
                source_type,
                embedding,
                created_by: session.user.id,
                status: 'draft'
            })
            .select()
            .single()

        if (articleError) throw articleError

        // Insert chunks
        const { error: chunksError } = await supabase
            .from('kb_article_chunks')
            .insert(
                chunkEmbeddings.map((chunk) => ({
                    article_id: article.id,
                    content: chunk.content,
                    embedding: chunk.embedding
                }))
            )

        if (chunksError) throw chunksError

        return NextResponse.json(article)
    } catch (error) {
        console.error('Error creating article:', error)
        return NextResponse.json(
            { error: 'Error creating article' },
            { status: 500 }
        )
    }
} 