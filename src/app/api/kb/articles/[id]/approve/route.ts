import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Update article status and store version
        const { data: article, error: articleError } = await supabase
            .from('kb_articles')
            .update({
                status: 'published',
                approved_by: session.user.id,
                approved_at: new Date().toISOString(),
                version: supabase.sql`version + 1`
            })
            .eq('id', params.id)
            .select()
            .single()

        if (articleError) throw articleError

        // Create version history
        const { error: versionError } = await supabase
            .from('kb_article_versions')
            .insert({
                article_id: params.id,
                content: article.content,
                version: article.version,
                created_by: session.user.id
            })

        if (versionError) throw versionError

        return NextResponse.json(article)
    } catch (error) {
        console.error('Error approving article:', error)
        return NextResponse.json(
            { error: 'Error approving article' },
            { status: 500 }
        )
    }
} 