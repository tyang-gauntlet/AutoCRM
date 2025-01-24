'use client'

import { Button } from '@/components/ui/button'
import { StarIcon, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { type ColumnDef } from '@tanstack/react-table'
import { Database } from '@/types/database'

type TicketFeedback = Database['public']['Tables']['ticket_feedback']['Row'] & {
    tickets: {
        title: string
        customer_id: string | null
        created_by: string | null
        customer: {
            name: string
            company: string | null
        } | null
        creator: {
            full_name: string | null
        } | null
    } | null
}

export const columns: ColumnDef<TicketFeedback>[] = [
    {
        accessorKey: 'tickets.title',
        header: 'Ticket',
        cell: ({ row }) => {
            const ticket = row.original.tickets
            if (!ticket) return <div>No ticket data</div>

            return (
                <div>
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-sm text-muted-foreground">
                        {ticket.customer?.company || 'No company'} - {ticket.customer?.name || 'No customer'}
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'rating',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Rating
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="flex items-center">
                {Array.from({ length: row.original.rating }).map((_, i) => (
                    <StarIcon key={`star-${i}`} className="h-4 w-4 text-yellow-400" />
                ))}
            </div>
        ),
    },
    {
        accessorKey: 'comment',
        header: 'Comment',
        cell: ({ row }) => (
            <div className="max-w-[500px] truncate">
                {row.original.comment || 'No comment'}
            </div>
        ),
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Submitted
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="text-sm">
                {row.original.created_at
                    ? format(new Date(row.original.created_at), 'MMM d, yyyy h:mm a')
                    : 'No date'
                }
            </div>
        ),
    },
] 