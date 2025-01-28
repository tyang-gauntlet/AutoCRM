import React from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleContent } from './article-content'

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
        .eq('slug', params.slug)
        .eq('status', 'published')
        .single()

    if (!article) {
        notFound()
    }

    return (
        <main className="container mx-auto p-8">
            <div className="mb-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/kb">
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
                <ArticleContent content={article.content} />
            </Card>
        </main>
    )
} 