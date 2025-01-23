import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const category = searchParams.get('category')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        if (!query) {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase.rpc('search_kb_articles', {
            search_query: query,
            category_slug: category || undefined,
            limit_val: limit,
            offset_val: offset
        })

        if (error) {
            console.error('Error searching knowledge base:', error)
            return NextResponse.json(
                { error: 'Failed to search knowledge base' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            results: data,
            metadata: {
                query,
                category,
                limit,
                offset
            }
        })
    } catch (error) {
        console.error('Error in knowledge base search:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 