import { generateSystemPrompt } from '@/lib/ai/prompts'

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()

        // Get dynamic system prompt
        const systemPrompt = await generateSystemPrompt()

        // Add system message to the beginning of the conversation
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ]

        // Rest of your existing chat handler code...
    } catch (error) {
        return new Response(JSON.stringify({ error: 'An error occurred' }), { status: 500 })
    }
} 