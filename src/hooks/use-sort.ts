import { useState, useMemo } from 'react'

type SortDirection = 'asc' | 'desc'

interface UseSortProps<T> {
    data: T[]
    initialSortKey?: keyof T
    initialDirection?: SortDirection
}

interface UseSortReturn<T> {
    sortedData: T[]
    sortKey: keyof T | null
    sortDirection: SortDirection
    setSortKey: (key: keyof T) => void
    toggleSortDirection: () => void
}

export function useSort<T extends Record<string, any>>({
    data,
    initialSortKey,
    initialDirection = 'asc'
}: UseSortProps<T>): UseSortReturn<T> {
    const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey || null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection)

    const sortedData = useMemo(() => {
        if (!sortKey) return data

        return [...data].sort((a, b) => {
            const aValue = a[sortKey]
            const bValue = b[sortKey]

            if (aValue === bValue) return 0

            const comparison = aValue < bValue ? -1 : 1
            return sortDirection === 'asc' ? comparison : -comparison
        })
    }, [data, sortKey, sortDirection])

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    }

    return {
        sortedData,
        sortKey,
        sortDirection,
        setSortKey,
        toggleSortDirection
    }
} 