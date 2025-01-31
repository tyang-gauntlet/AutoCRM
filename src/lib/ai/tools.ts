import { nanoid } from 'nanoid'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Tool, ToolCall } from './agent-interfaces'
import { Json } from '@/types/database'
import { searchKnowledge as searchKnowledgeRAG } from './rag'

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
    },
    resolveChat: {
        name: 'resolveChat',
        description: 'Resolve and close the current chat with an AI resolution',
        parameters: {
            resolution: { type: 'string', description: 'Summary of how the issue was resolved' },
            satisfaction_level: {
                type: 'string',
                enum: ['satisfied', 'partially_satisfied', 'unsatisfied'],
                description: 'Level of satisfaction with the resolution',
                default: 'satisfied'
            }
        },
        required_role: 'authenticated',
        enabled: true
    },
    createChat: {
        name: 'createChat',
        description: 'Create a new chat session',
        parameters: {},
        required_role: 'authenticated',
        enabled: true
    },
    addMessage: {
        name: 'addMessage',
        description: 'Add a message to an existing chat',
        parameters: {
            chatId: { type: 'string', description: 'ID of the chat to add the message to' },
            content: { type: 'string', description: 'Message content' },
            isAi: { type: 'boolean', description: 'Whether this is an AI message', default: false },
            toolCalls: { type: 'array', description: 'Tool calls made in this message', items: { type: 'object' } },
            contextUsed: { type: 'object', description: 'Context information used in this message' },
            metrics: { type: 'object', description: 'Message metrics' }
        },
        required_role: 'authenticated',
        enabled: true
    }
}

// Create authenticated Supabase client for the user
export function createAuthClient(userId: string) {
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

async function executeCreateChat(
    userId: string
): Promise<ToolCall> {
    console.log('🎯 Creating new chat:', { userId })
    const supabase = createAuthClient(userId)
    const toolCallId = nanoid()

    try {
        // Create new chat
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .insert({
                user_id: userId,
                status: 'active',
                metadata: {
                    tool_call_id: toolCallId,
                    created_via: 'ai_tool'
                }
            })
            .select()
            .single()

        if (chatError) {
            console.error('❌ Error creating chat:', chatError)
            throw chatError
        }

        console.log('✅ Successfully created chat:', { chatId: chat.id })

        return {
            id: toolCallId,
            name: 'createChat',
            args: {},
            result: { chatId: chat.id },
            error: null,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        }
    } catch (error) {
        console.error('❌ Failed to create chat:', error)
        return {
            id: toolCallId,
            name: 'createChat',
            args: {},
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        }
    }
}

async function executeAddMessage(
    args: {
        chatId: string,
        content: string,
        isAi?: boolean,
        toolCalls?: Json[],
        contextUsed?: Json,
        metrics?: Json
    },
    userId: string
): Promise<ToolCall> {
    console.log('📝 Adding message to chat:', {
        chatId: args.chatId,
        isAi: args.isAi,
        contentLength: args.content.length
    })

    const supabase = createAuthClient(userId)
    const toolCallId = nanoid()

    try {
        // First verify chat exists and is active
        const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('status')
            .eq('id', args.chatId)
            .single()

        if (chatError) {
            console.error('❌ Error finding chat:', chatError)
            throw chatError
        }

        if (chat.status !== 'active') {
            throw new Error('Cannot add message to non-active chat')
        }

        // Add message
        const { data: message, error: messageError } = await supabase
            .from('chat_messages')
            .insert({
                chat_id: args.chatId,
                content: args.content,
                sender_id: userId,
                is_ai: args.isAi || false,
                tool_calls: args.toolCalls ? args.toolCalls.map(tc => JSON.parse(JSON.stringify(tc))) : [],
                context_used: args.contextUsed || {},
                metrics: args.metrics || {},
                metadata: {
                    tool_call_id: toolCallId
                }
            })
            .select()
            .single()

        if (messageError) {
            console.error('❌ Error adding message:', messageError)
            throw messageError
        }

        console.log('✅ Successfully added message:', { messageId: message.id })

        return {
            id: toolCallId,
            name: 'addMessage',
            args,
            result: { messageId: message.id },
            error: null,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        }
    } catch (error) {
        console.error('❌ Failed to add message:', error)
        return {
            id: toolCallId,
            name: 'addMessage',
            args,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        }
    }
}

async function executeResolveChat(
    args: { resolution: string; satisfaction_level: string },
    userId: string
): Promise<ToolCall> {
    console.log('🎯 Starting chat resolution:', {
        userId,
        satisfaction_level: args.satisfaction_level
    })

    const supabase = createAuthClient(userId)
    const toolCallId = nanoid()

    try {
        // Get the latest active chat for the user
        const { data: chats, error: chatError } = await supabase
            .from('chats')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)

        if (chatError) {
            console.error('❌ Error finding active chat:', chatError)
            throw chatError
        }

        if (!chats || chats.length === 0) {
            throw new Error('No active chat found')
        }

        const activeChat = chats[0]

        // Update the chat with resolution details
        const { error: updateError } = await supabase
            .from('chats')
            .update({
                status: 'resolved',
                resolution: args.resolution,
                satisfaction_level: args.satisfaction_level,
                resolved_at: new Date().toISOString()
            })
            .eq('id', activeChat.id)

        if (updateError) {
            console.error('❌ Error updating chat resolution:', updateError)
            throw updateError
        }

        // Create an AI metric for the resolution
        const { data: metric, error: metricError } = await supabase
            .from('ai_metrics')
            .insert({
                trace_id: toolCallId,
                type: 'rgqs',
                score: args.satisfaction_level === 'satisfied' ? 1 :
                    args.satisfaction_level === 'partially_satisfied' ? 0.5 : 0,
                rgqs_metrics: {
                    resolution_text: args.resolution,
                    satisfaction_level: args.satisfaction_level
                },
                metadata: {
                    chat_id: activeChat.id,
                    resolution_type: 'chat'
                },
                created_by: userId
            })
            .select()
            .single()

        if (metricError) {
            console.warn('⚠️ Failed to create metric:', metricError)
        } else {
            console.log('✅ Created resolution metrics:', {
                metricId: metric.id,
                score: metric.score
            })
        }

        return {
            id: toolCallId,
            name: 'resolveChat',
            args,
            result: { chatId: activeChat.id },
            error: null,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        }
    } catch (error) {
        console.error('❌ Failed to resolve chat:', error)
        return {
            id: toolCallId,
            name: 'resolveChat',
            args,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
        }
    }
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
        args: {},
        result: null,
        error: null,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
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
                const results = await searchKnowledgeRAG(String(args.query), Number(args.limit) || 5)
                toolCall.result = results
                break
            }

            case 'createChat':
                return executeCreateChat(userId)

            case 'addMessage':
                return executeAddMessage(args as {
                    chatId: string,
                    content: string,
                    isAi?: boolean,
                    toolCalls?: Json[],
                    contextUsed?: Json,
                    metrics?: Json
                }, userId)

            case 'resolveChat':
                return executeResolveChat(args as { resolution: string; satisfaction_level: string }, userId)

            default:
                throw new Error(`Unknown tool: ${toolName}`)
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

    toolCall.endTime = new Date().toISOString()
    const duration = new Date(toolCall.endTime).getTime() - new Date(toolCall.startTime).getTime()
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
