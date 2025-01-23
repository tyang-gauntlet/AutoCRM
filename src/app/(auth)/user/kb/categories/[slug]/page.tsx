'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, BookOpen, FolderOpen } from 'lucide-react'
import Link from 'next/link'

interface Category {
    id: string
    name: string
    slug: string
    description: string
}

interface Article {
    id: string
    title: string
    slug: string
    content: string
    created_at: string
    updated_at: string
}

export default function CategoryPage() {
    const params = useParams()
    const [category, setCategory] = React.useState<Category | null>(null)
    const [articles, setArticles] = React.useState<Article[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        const fetchData = async () => {

            // Fetch category
            const { data: categoryData, error: categoryError } = await supabase
                .from('kb_categories')
                .select('*')
                .eq('slug', params.slug as string)
                .single()

            if (categoryError) {
                console.error('Error fetching category:', categoryError)
                setError('Category not found')
                setLoading(false)
                return
            }

            // Fetch articles in this category
            const { data: articlesData, error: articlesError } = await supabase
                .from('kb_articles')
                .select('*')
                .eq('category_id', categoryData.id)
                .eq('status', 'published')
                .order('title')

            if (articlesError) {
                console.error('Error fetching articles:', articlesError)
                setError('Failed to load articles')
            } else {
                setCategory(categoryData as Category)
                setArticles(articlesData || [])
            }
            setLoading(false)
        }

        fetchData()
    }, [params.slug])

    if (loading) {
        return (
            <div className="container mx-auto p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="space-y-4 mt-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !category) {
        return (
            <div className="container mx-auto p-8">
                <Card className="p-6 text-center">
                    <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
                    <p className="text-muted-foreground mb-4">
                        The category you're looking for doesn't exist or has been moved.
                    </p>
                    <Button asChild>
                        <Link href="/user/kb">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Knowledge Base
                        </Link>
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <main className="container mx-auto p-8">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/user/kb">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Knowledge Base
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FolderOpen className="h-8 w-8" />
                    {category.name}
                </h1>
                <p className="text-muted-foreground mt-2">{category.description}</p>
            </div>

            {articles.length > 0 ? (
                <div className="space-y-4">
                    {articles.map((article) => (
                        <Card key={article.id} className="p-6">
                            <Link
                                href={`/user/kb/articles/${article.slug}`}
                                className="block hover:no-underline"
                            >
                                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    {article.title}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {article.content.slice(0, 200)}...
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Last updated: {new Date(article.updated_at).toLocaleDateString()}
                                </p>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                        No articles found in this category.
                    </p>
                </Card>
            )}
        </main>
    )
} 