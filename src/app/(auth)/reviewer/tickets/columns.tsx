'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Ticket } from '@/hooks/use-reviewer-tickets'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export const columns: ColumnDef<Ticket>[] = [
    {
        accessorKey: 'title',
        header: 'Title',
    },
    {
        accessorKey: 'customer.email',
        header: 'Customer Email',
    },
    {
        accessorKey: 'creator.email',
        header: 'Created By',
    },
    {
        accessorKey: 'assigned.email',
        header: 'Assigned To',
        cell: ({ row }) => row.original.assigned?.email || 'Unassigned'
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={getStatusVariant(row.original.status) as "default" | "secondary" | "destructive" | "outline"}>
                {row.original.status}
            </Badge>
        )
    },
    {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => format(new Date(row.original.created_at), 'MMM d, yyyy')
    }
]

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case 'open':
            return 'default'
        case 'in_progress':
            return 'secondary'
        case 'resolved':
            return 'outline'
        case 'closed':
            return 'destructive'
        default:
            return 'default'
    }
} 