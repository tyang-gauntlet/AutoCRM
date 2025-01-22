export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
} as const

export const statusColors = {
    open: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
    closed: 'bg-red-100 text-red-800'
} as const 