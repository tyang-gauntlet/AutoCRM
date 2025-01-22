import { Badge } from '@/components/ui/badge'
import { priorityColors, statusColors, TicketPriority, TicketStatus } from '@/constants/ticket'

interface TicketBadgeProps {
    type: 'priority' | 'status'
    value: TicketPriority | TicketStatus
}

export function TicketBadge({ type, value }: TicketBadgeProps) {
    const colorMap = type === 'priority' ? priorityColors : statusColors
    const className = colorMap[value as keyof typeof colorMap]

    return (
        <Badge className={className}>
            {value}
        </Badge>
    )
} 