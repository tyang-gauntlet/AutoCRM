'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useTickets } from '@/hooks/use-tickets'

const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
} as const

const statusColors = {
    open: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
    closed: 'bg-red-100 text-red-800'
} as const

export function TicketList() {
    const { tickets, loading } = useTickets()

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assigned To</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>{ticket.customer?.name || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                                    {ticket.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                    {ticket.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>{ticket.assigned?.full_name || 'Unassigned'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    )
} 