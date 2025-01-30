import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { tools, executeToolCall } from '@/lib/ai/tools'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Get available tools
export async function GET(request: Request) {
    try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (!profile) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            )
        }

        // Filter tools by user role
        const availableTools = Object.values(tools).filter(
            tool => tool.enabled && tool.required_role === profile.role
        )

        return NextResponse.json(availableTools)
    } catch (error) {
        console.error('Error getting tools:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Execute a tool
export async function POST(request: Request) {
    try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { tool: toolName, args } = await request.json()

        if (!toolName || !args) {
            return NextResponse.json(
                { error: 'Tool name and arguments are required' },
                { status: 400 }
            )
        }

        const result = await executeToolCall(toolName, args, session.user.id)

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error executing tool:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 