import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { handleChat } from '@/lib/ai/agent'
import { AgentResponse } from '@/lib/ai/agent-interfaces'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { message, previousMessages, ticketId } = await req.json()

        // Get current user from cookie
        const cookieStore = cookies()
        const token = cookieStore.get('sb-access-token')?.value

        if (!token) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        if (userError || !user) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Process the chat message
        const response = await handleChat(
            message, // Can be null for initial greeting
            user.id,
            previousMessages || [],
            ticketId
        )

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.error('Error in chat API:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        )
    }
} 