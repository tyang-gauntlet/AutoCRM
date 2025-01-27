'use client'

import { useState, useEffect } from 'react'
import { useKB } from '@/hooks/use-kb'
import { KBArticle } from '@/types/kb'
import { ArticlesTable } from '@/components/kb/articles-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Plus, Search, Settings2 } from 'lucide-react'
import { Database } from '@/types/database'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { VisibilityState } from '@tanstack/react-table'

const COLUMNS = {
    title: 'Title',
    content: 'Content Preview',
    status: 'Status',
    tags: 'Tags',
} as const

export default function KBManagementPage() {
    const router = useRouter()
    const { loading, error, getArticles, deleteArticle } = useKB()
    const { toast } = useToast()
    const [articles, setArticles] = useState<KBArticle[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
        Object.keys(COLUMNS).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    )

    useEffect(() => {
        const timer = setTimeout(() => {
            loadArticles()
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const loadArticles = async () => {
        try {
            const data = await getArticles({
                search: searchQuery || undefined
            })
            setArticles(data || [])
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load articles',
                variant: 'destructive'
            })
        }
    }

    const handleEdit = (article: KBArticle) => {
        const dbArticle = article as KBArticle & Database['public']['Tables']['kb_articles']['Row']
        router.push(`/admin/kb/${dbArticle.id}`)
    }

    const handleDelete = async (article: KBArticle) => {
        try {
            const dbArticle = article as KBArticle & Database['public']['Tables']['kb_articles']['Row']
            await deleteArticle(dbArticle.id)
            toast({
                title: 'Success',
                description: 'Article deleted successfully'
            })
            loadArticles()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete article',
                variant: 'destructive'
            })
        }
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Knowledge Base</h1>
                <Button onClick={() => router.push('/admin/kb/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Article
                </Button>
            </div>

            <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search articles..."
                        className="pl-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {Object.entries(COLUMNS).map(([key, label]) => (
                            <DropdownMenuCheckboxItem
                                key={key}
                                className="capitalize"
                                checked={columnVisibility[key]}
                                onCheckedChange={(checked) => {
                                    setColumnVisibility(prev => ({
                                        ...prev,
                                        [key]: checked
                                    }))
                                }}
                            >
                                {label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {error ? (
                <div className="text-center text-red-500">
                    Error loading articles: {error}
                </div>
            ) : (
                <ArticlesTable
                    articles={articles}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    hideSearch
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                />
            )}
        </div>
    )
} 