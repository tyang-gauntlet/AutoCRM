import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processMessage } from '@/lib/ai/agent'
import { AgentResponse } from '@/lib/ai/agent-interfaces'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            console.error('No Authorization header')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Create server client with cookies
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                }
            }
        )

        // Verify the session
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1])

        if (authError || !user) {
            console.error('Auth error:', authError)
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { message, ticketId } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            )
        }

        const response: AgentResponse = await processMessage(
            message,
            ticketId,
            user.id
        )

        // Store message in ticket_messages if we have a ticket
        if (ticketId) {
            await supabase.from('ticket_messages').insert({
                ticket_id: ticketId,
                content: message,
                sender_id: user.id,
                is_ai: false
            })

            await supabase.from('ticket_messages').insert({
                ticket_id: ticketId,
                content: response.message,
                is_ai: true,
                tool_calls: response.tool_calls,
                context_used: response.context_used,
                metrics: response.metrics
            })
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error in chat endpoint:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 