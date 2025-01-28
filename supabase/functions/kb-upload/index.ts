// @ts-nocheck
import { serve } from "std/http/server.ts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
// Remove shared CORS import and define locally for now
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const openai = new OpenAIApi(
            new Configuration({
                apiKey: Deno.env.get('OPENAI_API_KEY'),
            })
        )

        const formData = await req.formData()
        const files = formData.getAll('files') as File[]

        const results = []

        for (const file of files) {
            const content = await file.text()
            const title = file.name.replace('.md', '')
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

            // Generate embeddings using OpenAI
            const chunks = splitIntoChunks(content)
            const embeddings = await Promise.all(
                chunks.map(async (chunk) => {
                    const response = await openai.createEmbedding({
                        model: 'text-embedding-ada-002',
                        input: chunk,
                    })
                    return response.data.data[0].embedding
                })
            )

            // Store article in KB
            const { data: article, error: articleError } = await supabase
                .from('kb_articles')
                .insert({
                    title,
                    slug,
                    content,
                    status: 'draft',
                    content_format: 'markdown',
                })
                .select()
                .single()

            if (articleError) throw articleError

            // Store embeddings
            const { error: embeddingError } = await supabase
                .from('kb_embeddings')
                .insert(
                    chunks.map((chunk, i) => ({
                        article_id: article.id,
                        content: chunk,
                        embedding: embeddings[i],
                    }))
                )

            if (embeddingError) throw embeddingError

            results.push({ title, slug })
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})

function splitIntoChunks(text: string, maxLength = 1000): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\s*\n/); // Split on double newlines
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > maxLength && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
} 