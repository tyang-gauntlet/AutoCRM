import type { TicketPriority, TicketStatus } from '@/constants/ticket'

export interface TicketMessage {
    id: string
    content: string
    created_at: string
    sender: {
        full_name: string
    }
}

export interface TicketWithDetails {
    id: string
    title: string
    description: string
    priority: TicketPriority
    status: TicketStatus
    created_at: string
    updated_at: string
    customer?: {
        name: string
        email?: string
    }
    assigned?: {
        full_name: string
    }
} 