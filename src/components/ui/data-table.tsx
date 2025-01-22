import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { useSort } from '@/hooks/use-sort'
import { usePagination } from '@/hooks/use-pagination'
import { Pagination } from './pagination'
import { EmptyState } from './empty-state'

interface Column<T> {
    key: keyof T
    header: string
    cell?: (item: T) => React.ReactNode
    sortable?: boolean
}

interface DataTableProps<T extends Record<string, any>> {
    data: T[]
    columns: Column<T>[]
    pageSize?: number
    emptyState?: {
        title: string
        description: string
    }
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    pageSize = 10,
    emptyState = {
        title: 'No results found',
        description: 'Try adjusting your search or filters'
    }
}: DataTableProps<T>) {
    const { sortedData, sortKey, sortDirection, setSortKey, toggleSortDirection } = useSort({ data })
    const {
        currentPage,
        totalPages,
        pageItems,
        setPage,
        canNextPage,
        canPrevPage,
        startIndex,
        endIndex
    } = usePagination({
        totalItems: sortedData.length,
        pageSize
    })

    const currentData = sortedData.slice(startIndex, endIndex)

    if (data.length === 0) {
        return (
            <EmptyState
                title={emptyState.title}
                description={emptyState.description}
            />
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(column => (
                                <TableHead key={column.key as string}>
                                    {column.sortable ? (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                if (sortKey === column.key) {
                                                    toggleSortDirection()
                                                } else {
                                                    setSortKey(column.key)
                                                }
                                            }}
                                            className="-ml-4"
                                        >
                                            {column.header}
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        column.header
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.map((item, index) => (
                            <TableRow key={index}>
                                {columns.map(column => (
                                    <TableCell key={column.key as string}>
                                        {column.cell ? column.cell(item) : item[column.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageItems={pageItems}
                    onPageChange={setPage}
                    canPrevPage={canPrevPage}
                    canNextPage={canNextPage}
                />
            )}
        </div>
    )
} 