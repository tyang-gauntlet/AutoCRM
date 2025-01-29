import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import {
    Search,
    BookOpen,
    ChevronRight,
    FolderOpen,
    Star
} from 'lucide-react'
import Link from 'next/link'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
interface Category {
    id: string
    name: string
    slug: string
    description: string | null
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

// Function to generate preview HTML
async function generatePreviewHtml(content: string) {
    try {
        const firstParagraph = content.split('\n').find(p => p.trim().length > 0) || ''
        const processedContent = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(firstParagraph)
        return processedContent.toString()
    } catch (error) {
        console.error('Error generating preview:', error)
        return ''
    }
}

export default async function KnowledgeBasePage({
    searchParams
}: {
    searchParams?: { q?: string }
}) {
    const searchQuery = searchParams?.q || ''


    // Fetch categories
    const { data: categories } = await supabase
        .from('kb_categories')
        .select('*')
        .order('name')

    // Fetch articles based on search query or get featured articles
    let articles: Article[] = []
    if (searchQuery) {
        // TODO: Add RPC call to search articles
        // const { data } = await supabase
        //     .rpc('search_kb_articles', {
        //         search_query: searchQuery,
        //         limit_val: 10,
        //         offset_val: 0
        //     })
        // articles = data || []
    } else {
        const { data } = await supabase
            .from('kb_articles')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(10)
        articles = data || []
    }

    // Generate preview HTML for articles
    const articlesWithPreview = await Promise.all(
        articles.map(async (article) => ({
            ...article,
            preview_html: await generatePreviewHtml(article.content)
        }))
    )

    return (
        <main className="container mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Knowledge Base</h1>
                <form className="flex gap-2" action="/kb" method="GET">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            name="q"
                            placeholder="Search the knowledge base..."
                            defaultValue={searchQuery}
                            className="w-full pl-9 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            {searchQuery ? (
                // Search Results
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">Search Results</h2>
                    {articlesWithPreview.length > 0 ? (
                        articlesWithPreview.map((article) => (
                            <Card key={article.id} className="p-6">
                                <Link
                                    href={`/kb/articles/${article.slug}`}
                                    className="block hover:no-underline"
                                >
                                    <h3 className="text-xl font-semibold mb-2 text-primary hover:text-primary/80">
                                        <BookOpen className="inline-block h-5 w-5 mr-2" />
                                        {article.title}
                                    </h3>
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
                            {categories?.map((category) => (
                                <Card key={category.id} className="p-6">
                                    <Link
                                        href={`/kb/categories/${category.slug}`}
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
                            {articlesWithPreview.map((article) => (
                                <Card key={article.id} className="p-6">
                                    <Link
                                        href={`/kb/articles/${article.slug}`}
                                        className="block hover:no-underline"
                                    >
                                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5" />
                                            {article.title}
                                        </h3>
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