// @ts-nocheck
import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    verbose: false
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

serve(async (req: Request) => {
    try {
        const { data: articles, error } = await supabaseClient
            .from('kb_articles')
            .select('id, title, content')
            .eq('status', 'published')

        if (error) throw error

        let totalChunks = 0
        for (const article of articles) {
            const chunks = article.content.match(/.{1,1000}/g) || []
            totalChunks += chunks.length
        }

        console.log(`\n🚀 Processing ${articles.length} articles (${totalChunks} chunks)`)

        let processedChunks = 0
        for (const article of articles) {
            const chunks = article.content.match(/.{1,1000}/g) || []

            for (const chunk of chunks) {
                processedChunks++
                if (processedChunks % 10 === 0 || processedChunks === totalChunks) { // Only log every 10th chunk
                    const progress = ((processedChunks / totalChunks) * 100).toFixed(1)
                    console.log(`⏳ ${progress}% (${processedChunks}/${totalChunks})`)
                }

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
        }

        console.log('\n✅ Complete! Processed:')
        console.log(`📊 ${articles.length} articles`)
        console.log(`📊 ${totalChunks} chunks`)
        console.log(`\n🔄 You can now stop the function with Ctrl+C`)

        return new Response(
            JSON.stringify({
                success: true,
                processed: {
                    articles: articles.length,
                    chunks: totalChunks
                }
            }),
            { headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('\n❌ Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}) 