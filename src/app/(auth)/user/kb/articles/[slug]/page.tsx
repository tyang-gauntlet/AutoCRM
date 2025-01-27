import React from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, BookOpen, Copy } from 'lucide-react'
import Link from 'next/link'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeStringify from 'rehype-stringify'
import { createHighlighter } from 'shiki'
import { cn } from '@/lib/utils'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

interface Article {
    id: string
    title: string
    content: string
    slug: string
    category_id: string | null
    status: string | null
    metadata: any
    search_vector: unknown | null
    created_at: string
    updated_at: string
    created_by: string | null
    updated_by: string | null
}

const rehypePrettyCodeOptions = {
    getHighlighter: () => createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: ['typescript', 'javascript', 'jsx', 'tsx', 'html', 'css', 'json', 'markdown', 'bash', 'shell', 'http']
    }),
    keepBackground: true,
    defaultLang: 'plaintext',
    theme: {
        dark: 'github-dark',
        light: 'github-light'
    }
} as const

interface PageProps {
    params: {
        slug: string
    }
}

export default async function ArticlePage({ params }: PageProps) {
    const supabase = createServerComponentClient({ cookies })

    const { data: article } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('slug', params.slug)  // params.slug is now guaranteed to exist
        .eq('status', 'published')
        .single()

    if (!article) {
        notFound()
    }

    const [htmlContent, setHtmlContent] = React.useState<string>('')

    React.useEffect(() => {
        const fetchArticle = async () => {
            try {
                const contentWithoutTitle = article.content.replace(/^#\s+.*\n/, '')
                const processedContent = await unified()
                    .use(remarkParse)
                    .use(remarkGfm)
                    .use(remarkRehype)
                    .use(rehypePrettyCode, rehypePrettyCodeOptions)
                    .use(rehypeStringify)
                    .process(contentWithoutTitle)

                setHtmlContent(processedContent.toString())
            } catch (err) {
                console.error('Error processing markdown:', err)
            }
        }

        fetchArticle()
    }, [article.content])

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
                    <BookOpen className="h-8 w-8" />
                    {article.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Last updated: {new Date(article.updated_at).toLocaleDateString()}
                </p>
            </div>

            <Card className="p-8">
                <article
                    className={cn(
                        "prose dark:prose-invert max-w-none",
                        // Headings
                        "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
                        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-4",
                        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
                        // Paragraphs and spacing
                        "[&_p]:my-4 [&_p]:leading-7",
                        // Code blocks
                        "[&_pre]:!bg-muted/50 [&_pre]:!p-4 [&_pre]:!mt-6 [&_pre]:!mb-6 [&_pre]:!rounded-lg",
                        "[&_pre_code]:!bg-transparent [&_pre_code]:!p-0",
                        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-[0.4em] [&_code]:py-[0.2em]",
                        "[&_code]:font-mono [&_code]:text-sm",
                        // Tables
                        "[&_table]:!mt-6 [&_table]:!mb-6 [&_table]:w-full",
                        "[&_thead_tr]:!border-b [&_thead_tr]:!border-border",
                        "[&_tbody_tr]:!border-b [&_tbody_tr]:!border-border",
                        "[&_tbody_tr:last-child]:!border-0",
                        "[&_thead_th]:!p-3 [&_thead_th]:!text-left",
                        "[&_tbody_td]:!p-3",
                        // Lists
                        "[&_ul]:!list-disc [&_ul]:!pl-6 [&_ul]:my-4",
                        "[&_ol]:!list-decimal [&_ol]:!pl-6 [&_ol]:my-4",
                        "[&_li]:my-1",
                        // Links
                        "[&_a]:text-primary [&_a]:underline [&_a]:font-medium",
                        // Blockquotes
                        "[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
                        // Strong and emphasis
                        "[&_strong]:font-bold [&_em]:italic"
                    )}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </Card>
        </main>
    )
} 