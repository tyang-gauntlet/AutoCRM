import { Client } from 'langsmith'
import { OpenAI } from 'openai'

const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export interface AIResponse {
    content: string
    context: {
        chunks: Array<{
            content: string
            article_id: string
            similarity: number
        }>
        relevant: Array<{
            content: string
            article_id: string
            is_relevant: boolean
        }>
        accuracy: number
        relevance: number
        contextMatch: number
    }
    quality: {
        overall: number
        relevance: number
        accuracy: number
        tone: number
    }
}

export async function generateResponse(message: string, traceId: string): Promise<AIResponse> {
    // Your existing AI logic here...

    // Add quality metrics calculation
    // const quality = await calculateQuality(response.content, message)

    return {
        content: "This is a dummy response content.",
        context: {
            chunks: [
                {
                    content: "Dummy chunk content",
                    article_id: "dummy_article_id_1",
                    similarity: 0.9
                }
            ],
            relevant: [
                {
                    content: "Dummy relevant content",
                    article_id: "dummy_article_id_2",
                    is_relevant: true
                }
            ],
            accuracy: 0.8,
            relevance: 0.85,
            contextMatch: 0.75
        },
        quality: {
            overall: 0.9,
            relevance: 0.85,
            accuracy: 0.8,
            tone: 0.95
        }
    }
}

export async function calculateQuality(response: string, query: string): Promise<AIResponse['quality']> {
    const prompt = `
        Analyze the following AI response to a user query.
        Rate each aspect on a scale of 0-1:

        Query: ${query}
        Response: ${response}

        Provide ratings for:
        1. Overall quality
        2. Relevance to query
        3. Accuracy of information
        4. Tone appropriateness

        Format: JSON object with numeric values
    `

    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    })

    const ratings = JSON.parse(completion.choices[0].message.content || '{}')

    return {
        overall: ratings.overall_quality,
        relevance: ratings.relevance,
        accuracy: ratings.accuracy,
        tone: ratings.tone
    }
} 