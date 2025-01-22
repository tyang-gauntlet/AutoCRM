import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    pageItems: number[]
    onPageChange: (page: number) => void
    canPrevPage: boolean
    canNextPage: boolean
}

export function Pagination({
    currentPage,
    totalPages,
    pageItems,
    onPageChange,
    canPrevPage,
    canNextPage
}: PaginationProps) {
    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canPrevPage}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageItems[0] > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                    >
                        1
                    </Button>
                    {pageItems[0] > 2 && (
                        <Button variant="outline" size="sm" disabled>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    )}
                </>
            )}

            {pageItems.map(page => (
                <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </Button>
            ))}

            {pageItems[pageItems.length - 1] < totalPages && (
                <>
                    {pageItems[pageItems.length - 1] < totalPages - 1 && (
                        <Button variant="outline" size="sm" disabled>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                    >
                        {totalPages}
                    </Button>
                </>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canNextPage}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
} 