import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TicketPriority, TicketStatus } from '@/constants/ticket'

interface TicketFiltersProps {
    priority?: TicketPriority
    status?: TicketStatus
    onPriorityChange: (value: TicketPriority) => void
    onStatusChange: (value: TicketStatus) => void
}

export function TicketFilters({
    priority,
    status,
    onPriorityChange,
    onStatusChange
}: TicketFiltersProps) {
    return (
        <div className="flex gap-4 mb-6">
            <Select value={priority} onValueChange={onPriorityChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
            </Select>

            <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
} 