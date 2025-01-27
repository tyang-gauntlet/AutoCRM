import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Metadata } from 'next'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

interface PageProps {
    params: {
        id: string
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = createServerComponentClient({ cookies })

    const { data: article } = await supabase
        .from('kb_articles')
        .select('title')
        .eq('id', params.id)
        .single()

    if (!article) {
        return {
            title: 'Article Not Found'
        }
    }

    return {
        title: article.title,
        description: `Knowledge base article: ${article.title}`
    }
}

export default async function ArticlePage({ params }: PageProps) {
    const supabase = createServerComponentClient({ cookies })

    const { data: article } = await supabase
        .from('kb_articles')
        .select(`
            *,
            category:kb_categories(id, name),
            creator:profiles!kb_articles_created_by_fkey(id, full_name),
            approver:profiles!kb_articles_approved_by_fkey(id, full_name)
        `)
        .eq('id', params.id)
        .single()

    if (!article) {
        notFound()
    }

    // Convert markdown to HTML
    const processedContent = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(article.content)

    const htmlContent = processedContent.toString()

    return (
        <div className="container max-w-4xl mx-auto py-10">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <span>
                            {article.creator?.full_name && `By ${article.creator.full_name}`}
                        </span>
                        <span>
                            {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {article.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {article.category && (
                    <div>
                        <Badge variant="secondary">
                            {article.category.name}
                        </Badge>
                    </div>
                )}

                <div
                    className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                <div className="border-t pt-4 mt-8">
                    <div className="text-sm text-muted-foreground">
                        Last updated: {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                        {article.approver?.full_name && (
                            <span className="ml-4">
                                Approved by: {article.approver.full_name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
} 