'use client'

import { useState, useEffect } from 'react'
import { useKB } from '@/hooks/use-kb'
import { ArticleStatus, KBArticle } from '@/types/kb'
import { ArticlePreview } from './article-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Search, Filter } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface ArticleListProps {
    filter?: {
        status?: ArticleStatus
        category?: string
        search?: string
    }
    onEdit?: (article: KBArticle) => void
    onDelete?: (article: KBArticle) => void
}

export function ArticleList({ filter, onEdit, onDelete }: ArticleListProps) {
    const { loading, error, getArticles, deleteArticle } = useKB()
    const { toast } = useToast()
    const [articles, setArticles] = useState<KBArticle[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearch = useDebounce(searchQuery, 300)

    useEffect(() => {
        loadArticles()
    }, [filter, debouncedSearch])

    const loadArticles = async () => {
        try {
            const data = await getArticles({
                ...filter,
                search: debouncedSearch || undefined
            })
            setArticles(data || [])
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to load articles',
                variant: 'destructive'
            })
        }
    }

    const handleDelete = async (article: KBArticle) => {
        try {
            await deleteArticle(article.id)
            toast({
                title: 'Success',
                description: 'Article deleted successfully'
            })
            loadArticles()
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to delete article',
                variant: 'destructive'
            })
        }
    }

    if (error) {
        return (
            <div className="text-center text-red-500">
                Error loading articles: {error}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search articles..."
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {articles.map((article) => (
                        <ArticlePreview
                            key={article.id}
                            article={article}
                            onEdit={() => onEdit?.(article)}
                            onDelete={() => handleDelete(article)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
} 