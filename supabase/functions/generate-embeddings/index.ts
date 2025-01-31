import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

interface Article {
    id: string;
    content: string;
    title: string;
}

// Validate environment variables
const requiredEnvVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
]

for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`)
    }
}

// Initialize OpenAI with error handling
const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')
})

// Initialize Supabase client with error handling
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase credentials')
}

const supabaseClient = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
)

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    modelName: 'text-embedding-3-small',
    dimensions: 1536,
    stripNewLines: true
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

const BATCH_SIZE = 5 // Process 5 articles at a time

function log(message: string) {
    console.log(message)
}

function validateEmbedding(embedding: number[]): boolean {
    if (!Array.isArray(embedding)) {
        log('Embedding is not an array')
        return false
    }
    if (embedding.length !== 1536) {
        log(`Invalid embedding dimension: ${embedding.length}`)
        return false
    }
    if (!embedding.every(n => typeof n === 'number' && !isNaN(n))) {
        log('Embedding contains invalid numbers')
        return false
    }
    return true
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

                // Validate embedding before insertion
                if (!validateEmbedding(embedding)) {
                    throw new Error(`Invalid embedding generated for chunk of article ${article.id}`)
                }

                // Log embedding details
                log(`Generated embedding: length=${embedding.length}, sample=[${embedding.slice(0, 3)}...]`)

                // Ensure embedding is a flat array of numbers
                const flatEmbedding = Array.from(embedding).map(n => Number(n))

                // Insert directly into kb_embeddings table
                const { data: insertData, error: insertError } = await supabaseClient
                    .from('kb_embeddings')
                    .insert({
                        article_id: article.id,
                        content: chunk,
                        embedding: flatEmbedding,
                        metadata: {}
                    })
                    .select('id')
                    .single()

                if (insertError) {
                    log(`Insert error: ${JSON.stringify(insertError)}`)
                    throw insertError
                }

                // Log successful embedding
                log(`✓ Chunk embedded: id=${insertData?.id}, dimensions=${flatEmbedding.length}`)
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
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
            modelName: 'text-embedding-3-small'
        });

        const result = await embeddings.embedQuery("Test embedding generation");

        return new Response(JSON.stringify({ success: true, embedding: result }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}) 