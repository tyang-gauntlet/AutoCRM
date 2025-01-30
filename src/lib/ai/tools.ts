import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Tool, ToolCall } from './agent-interfaces'
import { Json } from '@/types/database'

export const tools: Record<string, Tool> = {
    createTicket: {
        name: 'createTicket',
        description: 'Create a new support ticket',
        parameters: {
            title: { type: 'string', description: 'Title of the ticket' },
            description: { type: 'string', description: 'Description of the issue' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
        },
        required_role: 'authenticated',
        enabled: true
    },
    elevateTicket: {
        name: 'elevateTicket',
        description: 'Elevate a ticket to a human reviewer',
        parameters: {
            ticketId: { type: 'string', description: 'ID of the ticket to elevate' },
            reason: { type: 'string', description: 'Reason for elevation' }
        },
        required_role: 'user',
        enabled: true
    },
    closeTicket: {
        name: 'closeTicket',
        description: 'Close a resolved ticket',
        parameters: {
            ticketId: { type: 'string', description: 'ID of the ticket to close' },
            resolution: { type: 'string', description: 'Resolution summary' }
        },
        required_role: 'user',
        enabled: true
    },
    searchKnowledge: {
        name: 'searchKnowledge',
        description: 'Search the knowledge base for relevant articles',
        parameters: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Maximum number of results', default: 5 }
        },
        required_role: 'user',
        enabled: true
    }
}

// Create authenticated Supabase client for the user
function createAuthClient(userId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            global: {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'x-user-id': userId
                }
            }
        }
    )
}

async function getOrCreateProfile(userId: string): Promise<{ role: string }> {
    console.log('🔍 Getting or creating profile for:', userId)

    const supabase = createAuthClient(userId)

    // First try to get existing profile
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

    if (fetchError) {
        console.error('❌ Error fetching profile:', fetchError)
        throw new Error(`Failed to fetch user profile: ${fetchError.message}`)
    }

    if (profile?.role) {
        console.log('✅ Found existing profile:', profile)
        return { role: profile.role }
    }

    // If no profile exists, create one with default role
    console.log('📝 Creating new profile for user:', userId)
    const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select('role')
        .single()

    if (createError) {
        console.error('❌ Error creating profile:', createError)
        throw new Error(`Failed to create user profile: ${createError.message}`)
    }

    if (!newProfile?.role) {
        throw new Error('Failed to create profile with role')
    }

    console.log('✅ Created new profile:', newProfile)
    return { role: newProfile.role }
}

export async function executeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    userId: string
): Promise<ToolCall> {
    console.log('🔧 Executing tool:', {
        tool: toolName,
        args: JSON.stringify(args, null, 2),
        userId
    })

    const tool = tools[toolName]
    if (!tool) {
        console.error('❌ Tool not found:', toolName)
        throw new Error(`Tool ${toolName} not found`)
    }

    // Create authenticated client for this user
    const supabase = createAuthClient(userId)

    const toolCall: ToolCall = {
        id: nanoid(),
        name: toolName,
        arguments: args,
        start_time: new Date().toISOString()
    }

    try {
        // User is already authenticated at the API route level
        console.log('✅ Using authenticated user:', userId)

        // Validate required arguments
        if (toolName === 'createTicket') {
            console.log('🔍 Validating createTicket arguments:', args)
            if (!args.title) {
                throw new Error('Missing required argument: title')
            }
            if (!args.description) {
                throw new Error('Missing required argument: description')
            }
        }

        // Execute tool
        console.log('🚀 Executing tool logic:', toolName)
        switch (toolName) {
            case 'createTicket': {
                console.log('📝 Creating ticket with data:', {
                    title: String(args.title),
                    description: String(args.description),
                    priority: String(args.priority) || 'medium',
                    created_by: userId,
                    ai_handled: true,
                    status: 'open'
                })

                const { data, error } = await supabase
                    .from('tickets')
                    .insert({
                        title: String(args.title),
                        description: String(args.description),
                        priority: String(args.priority) || 'medium',
                        created_by: userId,
                        ai_handled: true,
                        status: 'open'
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('❌ Supabase error creating ticket:', {
                        code: error.code,
                        message: error.message,
                        details: error.details,
                        hint: error.hint
                    })
                    throw error
                }
                console.log('✅ Ticket created successfully:', data)
                toolCall.result = data
                break
            }

            case 'elevateTicket': {
                const { error } = await supabase
                    .from('tickets')
                    .update({
                        status: 'in_progress',
                        ai_handled: false,
                        metadata: {
                            elevation_reason: String(args.reason)
                        } as Json
                    })
                    .eq('id', String(args.ticketId))

                if (error) throw error
                toolCall.result = { success: true }
                break
            }

            case 'closeTicket': {
                const { error } = await supabase
                    .from('tickets')
                    .update({
                        status: 'closed',
                        metadata: {
                            resolution: String(args.resolution)
                        } as Json
                    })
                    .eq('id', String(args.ticketId))

                if (error) throw error
                toolCall.result = { success: true }
                break
            }

            case 'searchKnowledge': {
                const { data, error } = await supabase
                    .rpc('match_kb_embeddings', {
                        query_embedding: String(args.query),
                        similarity_threshold: 0.8,
                        match_count: Number(args.limit) || 5
                    })

                if (error) throw error
                toolCall.result = data
                break
            }

            default:
                throw new Error(`Tool ${toolName} not implemented`)
        }
    } catch (error) {
        console.error('❌ Tool execution error:', {
            tool: toolName,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            } : error,
            args: JSON.stringify(args, null, 2)
        })

        if (error instanceof Error) {
            toolCall.error = `${error.name}: ${error.message}`
        } else if (typeof error === 'object' && error !== null) {
            toolCall.error = JSON.stringify(error)
        } else {
            toolCall.error = 'An unexpected error occurred'
        }
    }

    toolCall.end_time = new Date().toISOString()
    const duration = new Date(toolCall.end_time).getTime() - new Date(toolCall.start_time).getTime()
    console.log('🏁 Tool execution completed:', {
        tool: toolName,
        success: !toolCall.error,
        duration,
        result: toolCall.result,
        error: toolCall.error
    })

    return toolCall
}

export function formatToolResult(tool: ToolCall): string {
    if (tool.error) return tool.error
    if (!tool.result) return ''

    // Special handling for createTicket result
    if (tool.name === 'createTicket' && typeof tool.result === 'object' && tool.result !== null) {
        const ticketResult = tool.result as {
            id: string,
            title: string,
            priority: string,
            status: string,
            created_at: string
        }
        return [
            `Ticket #${ticketResult.id}`,
            `Title: ${ticketResult.title}`,
            `Priority: ${ticketResult.priority}`,
            `Status: ${ticketResult.status}`,
            `Created: ${new Date(ticketResult.created_at).toLocaleString()}`
        ].join('\n')
    }

    // Handle other object results
    if (typeof tool.result === 'object') {
        return JSON.stringify(tool.result, null, 2)
    }

    // Handle string results
    return String(tool.result)
} 
