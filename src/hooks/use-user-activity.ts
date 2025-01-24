import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

type UserActivity = {
    id: string
    type: 'ticket' | 'kb' | 'interaction'
    title: string
    timestamp: string
    metadata?: any
}

type FAQ = {
    id: string
    title: string
    description: string
    slug: string
    preview_html: string
}

export function useUserActivity() {
    const [activities, setActivities] = useState<UserActivity[]>([])
    const [faqs, setFaqs] = useState<FAQ[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        let mounted = true

        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    setLoading(false)
                    return
                }

                // Fetch user's recent activities (interactions, ticket updates, kb views)
                const [interactionsResponse, ticketsResponse, kbResponse] = await Promise.all([
                    // Get recent interactions
                    supabase
                        .from('interactions')
                        .select('id, type, content, created_at, metadata')
                        .eq('user_id', session.user.id)
                        .order('created_at', { ascending: false })
                        .limit(5),

                    // Get recent ticket updates
                    supabase
                        .from('tickets')
                        .select('id, title, updated_at')
                        .eq('created_by', session.user.id)
                        .order('updated_at', { ascending: false })
                        .limit(5),

                    // Get recently viewed KB articles
                    supabase
                        .from('kb_articles')
                        .select('id, title, slug, created_at')
                        .order('created_at', { ascending: false })
                        .limit(5)
                ])

                // Combine and sort activities
                const allActivities: UserActivity[] = [
                    ...(interactionsResponse.data || []).map(interaction => ({
                        id: interaction.id,
                        type: 'interaction' as const,
                        title: interaction.content,
                        timestamp: interaction.created_at,
                        metadata: interaction.metadata
                    })),
                    ...(ticketsResponse.data || []).map(ticket => ({
                        id: ticket.id,
                        type: 'ticket' as const,
                        title: `Updated ticket: ${ticket.title}`,
                        timestamp: ticket.updated_at
                    })),
                    ...(kbResponse.data || []).map(article => ({
                        id: article.id,
                        type: 'kb' as const,
                        title: `Viewed article: ${article.title}`,
                        timestamp: article.created_at,
                        metadata: { slug: article.slug }
                    }))
                ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)

                // Fetch most viewed FAQs
                const { data: faqData } = await supabase
                    .from('kb_articles')
                    .select('id, title, slug, content')
                    .eq('status', 'published')
                    .order('metadata->view_count', { ascending: false })
                    .limit(3)

                if (mounted && faqData) {
                    // Process markdown previews for FAQs
                    const processedFaqs = await Promise.all(faqData.map(async (faq) => {
                        const contentWithoutTitle = faq.content?.replace(/^#\s+.*\n/, '') || ''
                        const previewContent = contentWithoutTitle.split('\n').slice(0, 3).join('\n') // Take first 3 lines
                        const processedContent = await unified()
                            .use(remarkParse)
                            .use(remarkGfm)
                            .use(remarkRehype)
                            .use(rehypeStringify)
                            .process(previewContent)

                        return {
                            id: faq.id,
                            title: faq.title,
                            description: faq.content.substring(0, 100) + '...',
                            slug: faq.slug,
                            preview_html: processedContent.toString()
                        }
                    }))

                    setActivities(allActivities)
                    setFaqs(processedFaqs)
                    setLoading(false)
                }
            } catch (error) {
                console.error('Error fetching user activity:', error)
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            mounted = false
        }
    }, [])

    return {
        activities,
        faqs,
        loading
    }
} 