import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ArticlePreview } from '@/components/kb/article-preview'
import { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { KBArticle } from '@/types/kb'

interface PageProps {
    params: {
        id: string
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

    const { data: article } = await supabase
        .from('kb_articles')
        .select('title, content')
        .eq('id', params.id)
        .single()

    if (!article) {
        return {
            title: 'Article Not Found'
        }
    }

    // Create a description from the first paragraph of content
    const firstParagraph = article.content
        .split('\n')
        .find((p: string) => p.trim().length > 0)
        ?.replace(/[#*`]/g, '')
        .slice(0, 160)

    return {
        title: article.title,
        description: firstParagraph || `Knowledge base article: ${article.title}`
    }
}

export default async function ArticlePage({ params }: PageProps) {

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

    return (
        <div className="container max-w-4xl mx-auto py-10">
            <ArticlePreview article={article as KBArticle} />

            <div className="border-t mt-8 pt-4">
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
    )
} 