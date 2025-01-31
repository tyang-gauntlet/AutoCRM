import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Tool, ToolCall } from './agent-interfaces'
import { Json } from '@/types/database'
import { searchKnowledge as searchKnowledgeRAG } from './rag'
import { traceToolExecution } from '../langsmith/tracing'

// Define tool implementations
const toolImplementations = {
    createTicket: async (params: {
        title: string,
        description: string,
        priority: 'low' | 'medium' | 'high' | 'urgent'
    }, userId: string) => {
        console.log('Creating ticket:', params)
        const supabase = createAuthClient(userId)

        const { data: ticket, error } = await supabase
            .from('tickets')
            .insert({
                title: params.title,
                description: params.description,
                priority: params.priority,
                status: 'open',
                created_by: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating ticket:', error)
            throw new Error(`Failed to create ticket: ${error.message}`)
        }

        return ticket
    },

    elevateTicket: async (params: {
        ticketId: string,
        reason: string
    }, userId: string) => {
        console.log('Elevating ticket:', params)
        const supabase = createAuthClient(userId)

        const { data: ticket, error } = await supabase
            .from('tickets')
            .update({
                status: 'in_review',
                elevation_reason: params.reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.ticketId)
            .select()
            .single()

        if (error) {
            console.error('Error elevating ticket:', error)
            throw new Error(`Failed to elevate ticket: ${error.message}`)
        }

        return ticket
    },

    closeTicket: async (params: {
        ticketId: string,
        resolution: string
    }, userId: string) => {
        console.log('Closing ticket:', params)
        const supabase = createAuthClient(userId)

        const { data: ticket, error } = await supabase
            .from('tickets')
            .update({
                status: 'closed',
                resolution: params.resolution,
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', params.ticketId)
            .select()
            .single()

        if (error) {
            console.error('Error closing ticket:', error)
            throw new Error(`Failed to close ticket: ${error.message}`)
        }

        return ticket
    },

    searchKnowledge: async (params: {
        query: string,
        limit?: number
    }) => {
        return searchKnowledgeRAG(params.query, params.limit)
    }
}

// Tool definitions with metadata
export const tools: Record<string, Tool> = {
    createTicket: {
        name: 'createTicket',
        description: 'Create a new support ticket',
        parameters: {
            title: { type: 'string', description: 'Title of the ticket' },
            description: { type: 'string', description: 'Description of the issue' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', description: 'Priority level of the ticket' }
        },
        required_role: 'authenticated',
        enabled: true,
        implementation: toolImplementations.createTicket
    },
    elevateTicket: {
        name: 'elevateTicket',
        description: 'Elevate a ticket to a human reviewer',
        parameters: {
            ticketId: { type: 'string', description: 'ID of the ticket to elevate' },
            reason: { type: 'string', description: 'Reason for elevation' }
        },
        required_role: 'user',
        enabled: true,
        implementation: toolImplementations.elevateTicket
    },
    closeTicket: {
        name: 'closeTicket',
        description: 'Close a resolved ticket',
        parameters: {
            ticketId: { type: 'string', description: 'ID of the ticket to close' },
            resolution: { type: 'string', description: 'Resolution summary' }
        },
        required_role: 'user',
        enabled: true,
        implementation: toolImplementations.closeTicket
    },
    searchKnowledge: {
        name: 'searchKnowledge',
        description: 'Search the knowledge base for relevant articles',
        parameters: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Maximum number of results', default: 5 }
        },
        required_role: 'user',
        enabled: true,
        implementation: toolImplementations.searchKnowledge
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
    params: any,
    userId: string,
    runId?: string
) {
    return traceToolExecution(
        'tool_execution',
        {
            userId,
            messageId: params.toString(),
        },
        toolName,
        params,
        async () => {
            const tool = tools[toolName]
            if (!tool) {
                throw new Error(`Tool ${toolName} not found`)
            }

            if (!tool.implementation) {
                throw new Error(`Tool ${toolName} has no implementation`)
            }

            try {
                const result = await tool.implementation(params, userId)
                return {
                    error: null,
                    result
                }
            } catch (error) {
                console.error(`Error executing tool ${toolName}:`, error)
                return {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    result: null
                }
            }
        },
        runId
    )
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
