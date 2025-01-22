import { useState, useMemo } from 'react'

interface UsePaginationProps {
    totalItems: number
    pageSize: number
    initialPage?: number
}

interface UsePaginationReturn {
    currentPage: number
    totalPages: number
    pageItems: number[]
    nextPage: () => void
    prevPage: () => void
    setPage: (page: number) => void
    canNextPage: boolean
    canPrevPage: boolean
    startIndex: number
    endIndex: number
}

export function usePagination({
    totalItems,
    pageSize,
    initialPage = 1
}: UsePaginationProps): UsePaginationReturn {
    const [currentPage, setCurrentPage] = useState(initialPage)

    const totalPages = Math.ceil(totalItems / pageSize)

    // Ensure current page is within bounds
    const safePage = Math.min(Math.max(currentPage, 1), totalPages)

    const startIndex = (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    const pageItems = useMemo(() => {
        const items = []
        const start = Math.max(1, safePage - 2)
        const end = Math.min(totalPages, start + 4)

        for (let i = start; i <= end; i++) {
            items.push(i)
        }
        return items
    }, [safePage, totalPages])

    const nextPage = () => {
        if (safePage < totalPages) {
            setCurrentPage(safePage + 1)
        }
    }

    const prevPage = () => {
        if (safePage > 1) {
            setCurrentPage(safePage - 1)
        }
    }

    const setPage = (page: number) => {
        const newPage = Math.min(Math.max(page, 1), totalPages)
        setCurrentPage(newPage)
    }

    return {
        currentPage: safePage,
        totalPages,
        pageItems,
        nextPage,
        prevPage,
        setPage,
        canNextPage: safePage < totalPages,
        canPrevPage: safePage > 1,
        startIndex,
        endIndex
    }
} 