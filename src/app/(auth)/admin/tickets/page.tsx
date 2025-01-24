'use client'

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTickets, type Ticket } from "@/hooks/use-tickets"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, MoreHorizontal, Eye, UserPlus, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/database"

type SortableColumn = 'title' | 'status' | 'priority'

type SortConfig = {
    key: SortableColumn
    direction: 'asc' | 'desc'
} | null

export default function TicketsPage() {
    const searchParams = useSearchParams()
    const priorityFilter = searchParams.get("priority")
    const [search, setSearch] = React.useState("")
    const [sortConfig, setSortConfig] = React.useState<SortConfig>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [ticketToDelete, setTicketToDelete] = React.useState<string | null>(null)
    const { tickets, loading } = useTickets(priorityFilter || undefined)
    const { toast } = useToast()
    const supabase = createClientComponentClient<Database>()

    const filteredAndSortedTickets = React.useMemo(() => {
        let result = [...tickets]

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase()
            result = result.filter(ticket =>
                ticket.title.toLowerCase().includes(searchLower) ||
                ticket.status.toLowerCase().includes(searchLower) ||
                ticket.priority.toLowerCase().includes(searchLower)
            )
        }

        // Apply sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = String(a[sortConfig.key])
                const bValue = String(b[sortConfig.key])

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [tickets, search, sortConfig])

    const handleSort = (key: SortableColumn) => {
        setSortConfig(current => {
            if (current?.key === key) {
                if (current.direction === 'asc') {
                    return { key, direction: 'desc' }
                }
                return null
            }
            return { key, direction: 'asc' }
        })
    }

    const handleDeleteTicket = async (ticketId: string) => {
        try {
            setIsDeleting(true)
            const { error } = await supabase
                .from('tickets')
                .delete()
                .match({ id: ticketId })

            if (error) throw error

            toast({
                title: "Ticket deleted",
                description: "The ticket has been successfully deleted.",
            })
            setDialogOpen(false)
            setTicketToDelete(null)
        } catch (error) {
            console.error('Error deleting ticket:', error)
            toast({
                title: "Error",
                description: "Failed to delete the ticket. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const SortableHeader = ({ column }: { column: SortableColumn }) => (
        <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-2">
                {column.charAt(0).toUpperCase() + column.slice(1)}
                <ArrowUpDown className="h-4 w-4" />
            </div>
        </TableHead>
    )

    return (
        <div className="flex-1 flex-col space-y-8 p-8 flex">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
                <p className="text-muted-foreground">
                    Here&apos;s a list of all {priorityFilter?.split(',').join(',') || ''} priority tickets
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Filter tickets..."
                    className="h-8 w-[250px] bg-background"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <SortableHeader column="title" />
                            <SortableHeader column="status" />
                            <SortableHeader column="priority" />
                            <TableHead className="w-[50px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredAndSortedTickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    No tickets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedTickets.map((ticket) => (
                                <TableRow key={ticket.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <Link href={`/admin/tickets/${ticket.id}`} className="hover:underline">
                                            {ticket.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            ticket.status === 'resolved' ? 'default' :
                                                ticket.status === 'in_progress' ? 'secondary' :
                                                    'outline'
                                        }>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            ticket.priority === 'high' ? 'destructive' :
                                                ticket.priority === 'medium' ? 'default' :
                                                    'secondary'
                                        }>
                                            {ticket.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 hover:bg-muted"
                                                >
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/admin/tickets/${ticket.id}`}
                                                        className="flex items-center"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Assign to...
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Change status
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog
                                                    open={dialogOpen && ticketToDelete === ticket.id}
                                                    onOpenChange={(open) => {
                                                        setDialogOpen(open)
                                                        if (!open) setTicketToDelete(null)
                                                    }}
                                                >
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault()
                                                                setTicketToDelete(ticket.id)
                                                                setDialogOpen(true)
                                                            }}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete ticket
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this ticket? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => ticketToDelete && handleDeleteTicket(ticketToDelete)}
                                                                disabled={isDeleting}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                {isDeleting ? "Deleting..." : "Delete"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
} 