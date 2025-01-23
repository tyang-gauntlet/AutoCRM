'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, BookOpen, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { cn } from '@/lib/utils'

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
    preview_html?: string
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
                // Process markdown previews
                const processedArticles = await Promise.all((articlesData || []).map(async (article) => {
                    const contentWithoutTitle = article.content.replace(/^#\s+.*\n/, '')
                    const previewContent = contentWithoutTitle.split('\n').slice(0, 3).join('\n') // Take first 3 lines
                    const processedContent = await unified()
                        .use(remarkParse)
                        .use(remarkGfm)
                        .use(remarkRehype)
                        .use(rehypeStringify)
                        .process(previewContent)

                    return {
                        ...article,
                        preview_html: processedContent.toString()
                    }
                }))

                setCategory(categoryData as Category)
                setArticles(processedArticles)
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
                                <div
                                    className={cn(
                                        "text-sm text-muted-foreground",
                                        "prose dark:prose-invert max-w-none",
                                        "[&>*:first-child]:mt-0",
                                        "[&>*:last-child]:mb-0",
                                        // Headings
                                        "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2",
                                        "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2",
                                        "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
                                        // Paragraphs and spacing
                                        "[&_p]:my-2 [&_p]:leading-6",
                                        // Lists
                                        "[&_ul]:!list-disc [&_ul]:!pl-6 [&_ul]:my-2",
                                        "[&_ol]:!list-decimal [&_ol]:!pl-6 [&_ol]:my-2",
                                        "[&_li]:my-0.5",
                                        // Links
                                        "[&_a]:text-primary [&_a]:underline [&_a]:font-medium",
                                        // Strong and emphasis
                                        "[&_strong]:font-bold [&_em]:italic"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: article.preview_html || '' }}
                                />
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