// @ts-nocheck
import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"

const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')
})

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: Deno.env.get('OPENAI_API_KEY')
})

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: [
        "\n## ",     // h2
        "\n### ",    // h3
        "\n#### ",   // h4
        "\n##### ",  // h5
        "\n###### ", // h6
        "\n\n",      // paragraphs
        "\n",        // line breaks
        ". ",        // sentences
        "! ",        // exclamations
        "? ",        // questions
        ";",         // semicolons
        ":",         // colons
        " ",         // words
        ""           // characters
    ]
})

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
        auth: {
            persistSession: false
        }
    }
)

const BATCH_SIZE = 5 // Process 5 articles at a time

function log(message: string) {
    console.log(message)
}

async function processArticle(article, batchNum: number, articleNum: number, totalArticles: number) {
    try {
        const chunks = await textSplitter.splitText(article.content)
        log(`Processing [${articleNum}/${totalArticles}] "${article.title}" (${chunks.length} chunks)`)

        // Start a transaction for this article
        const { error: txError } = await supabaseClient.rpc('begin_transaction')
        if (txError) throw txError

        try {
            for (const chunk of chunks) {
                const embedding = await embeddings.embedQuery(chunk)
                const { error: insertError } = await supabaseClient
                    .from('kb_embeddings')
                    .insert({
                        article_id: article.id,
                        content: chunk,
                        embedding
                    })

                if (insertError) throw insertError
            }

            // Update article to mark it as processed
            const { error: updateError } = await supabaseClient
                .from('kb_articles')
                .update({ has_embeddings: true })
                .eq('id', article.id)

            if (updateError) throw updateError

            // Commit transaction
            const { error: commitError } = await supabaseClient.rpc('commit_transaction')
            if (commitError) throw commitError

            log(`✓ Completed "${article.title}"`)
            return { success: true, articleId: article.id, chunks: chunks.length }
        } catch (error) {
            // Rollback on error
            await supabaseClient.rpc('rollback_transaction')
            throw error
        }
    } catch (error) {
        log(`× Failed "${article.title}": ${error.message}`)
        return { success: false, articleId: article.id, error: error.message }
    }
}

serve(async (req: Request) => {
    try {
        // Get unprocessed articles
        const { data: articles, error } = await supabaseClient
            .from('kb_articles')
            .select('id, title, content')
            .eq('status', 'published')
            .eq('has_embeddings', false)
            .order('created_at', { ascending: true })

        if (error) throw error

        if (!articles?.length) {
            log('No articles to process')
            return new Response(
                JSON.stringify({ success: true, processed: { articles: 0, chunks: 0 } }),
                { headers: { 'Content-Type': 'application/json' } }
            )
        }

        log(`\nProcessing ${articles.length} articles\n`)

        const results = {
            successful: 0,
            failed: 0,
            totalChunks: 0,
            errors: []
        }

        // Process articles in batches
        for (let i = 0; i < articles.length; i += BATCH_SIZE) {
            const batch = articles.slice(i, i + BATCH_SIZE)

            const batchResults = await Promise.all(
                batch.map((article, idx) =>
                    processArticle(article, Math.floor(i / BATCH_SIZE) + 1, i + idx + 1, articles.length)
                )
            )

            // Aggregate batch results
            for (const result of batchResults) {
                if (result.success) {
                    results.successful++
                    results.totalChunks += result.chunks
                } else {
                    results.failed++
                    results.errors.push({
                        articleId: result.articleId,
                        error: result.error
                    })
                }
            }
        }

        // Final summary
        log(`\nSummary:`)
        log(`✓ Processed ${results.successful} articles (${results.totalChunks} chunks)`)
        if (results.failed > 0) {
            log(`× Failed ${results.failed} articles:`)
            results.errors.forEach(err => log(`  • ${err.error}`))
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: {
                    successful: results.successful,
                    failed: results.failed,
                    totalChunks: results.totalChunks,
                    errors: results.errors
                }
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        log(`Fatal error: ${error.message}`)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}) 