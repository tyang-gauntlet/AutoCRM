'use client'

import { useState, useCallback } from 'react'
import { useKB } from '@/hooks/use-kb'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export function KBSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const { loading, searchKB } = useKB()
    const debouncedQuery = useDebounce(query, 300)

    const handleSearch = useCallback(async () => {
        if (!debouncedQuery.trim()) {
            setResults([])
            return
        }

        try {
            const { results } = await searchKB(debouncedQuery)
            setResults(results)
        } catch (error) {
            console.error('Search failed:', error)
        }
    }, [debouncedQuery, searchKB])

    return (
        <div className="space-y-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search knowledge base..."
                    className="pl-10"
                />
            </div>

            {loading && (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}

            <div className="space-y-2">
                {results.map((result) => (
                    <Card key={result.id} className="p-4">
                        <div className="prose prose-sm max-w-none">
                            {result.content}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                            Relevance: {Math.round(result.similarity * 100)}%
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
} 