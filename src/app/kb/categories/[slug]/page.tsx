import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, BookOpen } from 'lucide-react'
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

interface PageProps {
    params: {
        slug: string
    }
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

export default async function CategoryPage({ params }: PageProps) {
    const supabase = createServerComponentClient({ cookies })

    // Get category
    const { data: category, error: categoryError } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('slug', params.slug)
        .single()

    if (categoryError || !category) {
        notFound()
    }

    // Get articles in this category
    const { data: articles } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('category_id', category.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

    // Generate preview HTML for each article
    const articlesWithPreview = await Promise.all(
        (articles || []).map(async (article) => ({
            ...article,
            preview_html: await generatePreviewHtml(article.content)
        }))
    )

    return (
        <div className="container mx-auto p-8">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/kb">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Knowledge Base
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold mb-4">{category.name}</h1>
                {category.description && (
                    <p className="text-muted-foreground">{category.description}</p>
                )}
            </div>

            <div className="grid gap-6">
                {articlesWithPreview?.map((article) => (
                    <Card key={article.id} className="p-6">
                        <Link
                            href={`/kb/articles/${article.slug}`}
                            className="block hover:no-underline"
                        >
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-primary hover:text-primary/80">
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
        </div>
    )
} 