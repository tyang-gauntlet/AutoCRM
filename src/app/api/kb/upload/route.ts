import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export async function POST(req: NextRequest) {
    console.log('[KB Upload] Starting upload process')

    try {
        // Initialize Supabase client with auth context
        const cookieStore = cookies()
        const accessToken = cookieStore.get('sb-access-token')?.value

        if (!accessToken) {
            console.log('[KB Upload] No access token found in cookies')
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                },
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        )

        // Get current session
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
            console.error('[KB Upload] User fetch error:', userError)
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (!user) {
            console.log('[KB Upload] No user found')
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        console.log('[KB Upload] Authenticated as user:', user.id)

        // Verify admin role
        console.log('[KB Upload] Checking admin role for user:', user.id)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('[KB Upload] Profile fetch error:', profileError)
            throw new Error('Failed to verify user role')
        }
        if (profile?.role !== 'admin') {
            console.log('[KB Upload] Non-admin user attempted upload:', user.id)
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Get request data
        console.log('[KB Upload] Processing form data')
        const formData = await req.formData()
        const file = formData.get('file') as File
        const title = formData.get('title') as string
        const categoryId = formData.get('categoryId') as string

        console.log('[KB Upload] Form data received:', {
            hasFile: !!file,
            fileType: file?.type,
            fileSize: file?.size,
            title,
            categoryId
        })

        if (!file || !title || !categoryId) {
            console.log('[KB Upload] Missing fields:', {
                hasFile: !!file,
                hasTitle: !!title,
                hasCategoryId: !!categoryId
            })
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Read file content
        console.log('[KB Upload] Reading file content')
        let content: string
        try {
            content = await file.text()
            console.log('[KB Upload] File content read successfully, length:', content.length)
        } catch (error) {
            console.error('[KB Upload] Error reading file:', error)
            return new Response(JSON.stringify({
                error: 'Failed to read file content',
                details: error instanceof Error ? error.message : 'Unknown error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        // Create article
        console.log('[KB Upload] Creating article:', { title, slug, categoryId })
        const { data: article, error: articleError } = await supabase
            .from('kb_articles')
            .insert({
                title,
                slug,
                content,
                category_id: categoryId,
                content_format: 'markdown',
                created_by: user.id,
                updated_by: user.id,
                status: 'draft'
            })
            .select()
            .single()

        if (articleError) {
            console.error('[KB Upload] Article creation error:', articleError)
            return new Response(JSON.stringify({
                error: 'Failed to create article',
                details: articleError
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Split content into chunks
        console.log('[KB Upload] Splitting content into chunks')
        try {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            })

            const chunks = await splitter.createDocuments([content])
            console.log('[KB Upload] Created chunks:', chunks.length)

            // Generate embeddings
            if (!process.env.OPENAI_API_KEY) {
                console.error('[KB Upload] Missing OpenAI API key')
                throw new Error('OpenAI API key not configured')
            }

            console.log('[KB Upload] Generating embeddings')
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY
            })

            // Process chunks in batches to avoid rate limits
            console.log('[KB Upload] Processing chunks in batches')
            const batchSize = 5
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize)
                console.log(`[KB Upload] Processing batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`)

                let batchEmbeddings
                try {
                    batchEmbeddings = await embeddings.embedDocuments(
                        batch.map(chunk => chunk.pageContent)
                    )
                } catch (error) {
                    console.error('[KB Upload] Embedding generation error:', error)
                    throw new Error('Failed to generate embeddings')
                }

                // Store chunks and embeddings
                console.log('[KB Upload] Attempting to store chunk batch:', {
                    batchNumber: i / batchSize + 1,
                    batchSize: batch.length,
                    articleId: article.id,
                    firstChunkLength: batch[0]?.pageContent.length,
                    firstEmbeddingLength: batchEmbeddings[0]?.length
                })

                // Prepare base chunk data without metadata
                const chunkData = batch.map((chunk, index) => ({
                    article_id: article.id,
                    content: chunk.pageContent,
                    embedding: batchEmbeddings[index]
                }))

                console.log('[KB Upload] Chunk data prepared:', {
                    count: chunkData.length,
                    sample: {
                        article_id: chunkData[0].article_id,
                        content_length: chunkData[0].content.length,
                        embedding_length: chunkData[0].embedding.length
                    }
                })

                const { error: chunksError } = await supabase
                    .from('kb_embeddings')
                    .insert(chunkData)

                if (chunksError) {
                    console.error('[KB Upload] Chunk storage error:', {
                        code: chunksError.code,
                        message: chunksError.message,
                        details: chunksError.details,
                        hint: chunksError.hint
                    })
                    throw new Error(`Failed to store article chunks: ${chunksError.message}`)
                }
            }

            console.log('[KB Upload] Upload completed successfully:', { articleId: article.id })
            return new Response(JSON.stringify({ success: true, article }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })

        } catch (error) {
            console.error('[KB Upload] Processing error:', error)
            // Delete the article if chunk processing fails
            if (article?.id) {
                console.log('[KB Upload] Cleaning up failed article:', article.id)
                await supabase
                    .from('kb_articles')
                    .delete()
                    .eq('id', article.id)
            }
            return new Response(JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to process article',
                details: error instanceof Error ? error.stack : undefined
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

    } catch (error) {
        console.error('[KB Upload] Unhandled error:', error)
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Failed to process article',
                details: error instanceof Error ? error.stack : undefined
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
} 