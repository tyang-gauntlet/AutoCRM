'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Search,
    BookOpen,
    ChevronRight,
    FolderOpen,
    Star
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    parent_id: string | null
    created_at: string
    updated_at: string
}

interface Article {
    id: string
    title: string
    slug: string
    content: string
    category_id: string | null
    status: string | null
    metadata: any
    created_at: string
    updated_at: string
    created_by: string | null
    updated_by: string | null
    search_rank?: number
}

export default function KnowledgeBasePage() {
    const searchParams = useSearchParams()
    const [categories, setCategories] = React.useState<Category[]>([])
    const [articles, setArticles] = React.useState<Article[]>([])
    const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '')
    const [loading, setLoading] = React.useState(true)
    const [searching, setSearching] = React.useState(false)
    const debouncedQuery = useDebounce(searchQuery, 300)

    React.useEffect(() => {
        const fetchData = async () => {
            // Fetch categories
            const { data: categoriesData } = await supabase
                .from('kb_categories')
                .select('*')
                .order('name')

            if (categoriesData) setCategories(categoriesData)
            setLoading(false)
        }

        fetchData()
    }, [])

    React.useEffect(() => {
        const searchArticles = async () => {
            setSearching(true)
            try {
                if (!debouncedQuery.trim()) {
                    // If no search query, show featured articles
                    const { data } = await supabase
                        .from('kb_articles')
                        .select('*')
                        .eq('status', 'published')
                        .order('created_at', { ascending: false })
                        .limit(4)
                    setArticles((data || []) as Article[])
                } else {
                    // If there's a search query, use the search function
                    const { data, error } = await supabase
                        .rpc('search_kb_articles', {
                            search_query: debouncedQuery,
                            limit_val: 10,
                            offset_val: 0
                        })

                    if (error) throw error
                    setArticles((data || []) as Article[])
                }
            } catch (error) {
                console.error('Error searching articles:', error)
                setArticles([])
            } finally {
                setSearching(false)
            }
        }

        searchArticles()
    }, [debouncedQuery])

    const getHighlightedText = (text: string, query: string) => {
        if (!query.trim()) return text

        const regex = new RegExp(`(${query})`, 'gi')
        const parts = text.split(regex)

        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
        )
    }

    const getExcerpt = (content: string, query: string, maxLength = 200) => {
        if (!content) return ''

        if (!query.trim()) {
            return content.slice(0, maxLength) + '...'
        }

        const lowerContent = content.toLowerCase()
        const lowerQuery = query.toLowerCase()
        const index = lowerContent.indexOf(lowerQuery)

        if (index === -1) {
            return content.slice(0, maxLength) + '...'
        }

        const start = Math.max(0, index - 100)
        const end = Math.min(content.length, index + 100)
        return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '')
    }

    if (loading) {
        return (
            <div className="container mx-auto p-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <main className="container mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Knowledge Base</h1>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search the knowledge base..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {searching ? (
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Searching...</p>
                </div>
            ) : searchQuery ? (
                // Search Results
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
                    {articles.length > 0 ? (
                        articles.map((article) => (
                            <Card key={article.id} className="p-6">
                                <Link
                                    href={`/user/kb/articles/${article.slug}`}
                                    className="block hover:no-underline"
                                >
                                    <h3 className="text-xl font-semibold mb-2 text-primary hover:text-primary/80">
                                        <BookOpen className="inline-block h-5 w-5 mr-2" />
                                        {getHighlightedText(article.title, searchQuery)}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {getHighlightedText(getExcerpt(article.content, searchQuery), searchQuery)}
                                    </p>
                                </Link>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Categories */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <FolderOpen className="h-6 w-6" />
                            Categories
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => (
                                <Card key={category.id} className="p-6">
                                    <Link
                                        href={`/user/kb/categories/${category.slug}`}
                                        className="block hover:no-underline"
                                    >
                                        <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {category.description}
                                        </p>
                                        <Button variant="ghost" className="gap-2" size="sm">
                                            Browse Articles
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Featured Articles */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Star className="h-6 w-6" />
                            Featured Articles
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {articles.map((article) => (
                                <Card key={article.id} className="p-6">
                                    <Link
                                        href={`/user/kb/articles/${article.slug}`}
                                        className="block hover:no-underline"
                                    >
                                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5" />
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {article.content.slice(0, 150)}...
                                        </p>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </main>
    )
} 