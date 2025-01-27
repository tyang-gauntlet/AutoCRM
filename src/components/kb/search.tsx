'use client'

import React, { useState } from 'react'
import { useKB } from '@/hooks/use-kb'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
    id: string
    content: string
    article_id: string
    similarity: number
}

export function Search() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const { loading, searchKB } = useKB()
    const debouncedQuery = useDebounce(query, 300)

    React.useEffect(() => {
        const search = async () => {
            if (!debouncedQuery) {
                setResults([])
                return
            }

            try {
                const data = await searchKB(debouncedQuery)
                setResults(data || [])
            } catch (error) {
                console.error('Search error:', error)
                setResults([])
            }
        }

        search()
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

            {loading ? (
                <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : (
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
            )}
        </div>
    )
} 