import { useCallback, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { KBArticle, KBCategory, CreateArticleRequest } from '@/types/kb'

export function useKB() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClientComponentClient()

    const createArticle = useCallback(async (data: CreateArticleRequest) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/kb/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error('Failed to create article')
            }

            return await response.json()
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const approveArticle = useCallback(async (id: string) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/kb/articles/${id}/approve`, {
                method: 'POST'
            })

            if (!response.ok) {
                throw new Error('Failed to approve article')
            }

            return await response.json()
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const searchKB = useCallback(async (query: string) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}`)
            if (!response.ok) {
                throw new Error('Search failed')
            }

            return await response.json()
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const getArticles = useCallback(async (filter?: {
        status?: ArticleStatus
        category?: string
        search?: string
    }) => {
        try {
            setLoading(true)
            setError(null)

            let query = supabase
                .from('kb_articles')
                .select(`
                    *,
                    category:kb_categories(id, name),
                    creator:profiles!kb_articles_created_by_fkey(id, full_name),
                    approver:profiles!kb_articles_approved_by_fkey(id, full_name),
                    tags
                `)
                .order('created_at', { ascending: false })

            if (filter?.status) {
                query = query.eq('status', filter.status)
            }
            if (filter?.category) {
                query = query.eq('category_id', filter.category)
            }
            if (filter?.search) {
                query = query.textSearch('search_vector', filter.search)
            }

            const { data, error: queryError } = await query

            if (queryError) throw queryError
            console.log('Articles data:', data)
            return data?.map(article => ({
                ...article,
                created_by: article.creator,
                approved_by: article.approver,
                tags: article.tags || []
            }))
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const deleteArticle = useCallback(async (id: string) => {
        try {
            setLoading(true)
            setError(null)

            const { error } = await supabase
                .from('kb_articles')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const getVersionHistory = useCallback(async (articleId: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('kb_article_versions')
                .select(`
                    *,
                    created_by:profiles(id, full_name)
                `)
                .eq('article_id', articleId)
                .order('version', { ascending: false })

            if (error) throw error
            return data
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const getArticle = useCallback(async (id: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('kb_articles')
                .select(`
                    *,
                    category:kb_categories(id, name),
                    creator:profiles!kb_articles_created_by_fkey(id, full_name),
                    approver:profiles!kb_articles_approved_by_fkey(id, full_name)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            return {
                ...data,
                created_by: data.creator,
                approved_by: data.approver
            }
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const updateArticle = useCallback(async (id: string, data: Partial<KBArticle>) => {
        try {
            setLoading(true)
            setError(null)

            const { error } = await supabase
                .from('kb_articles')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [supabase])

    return {
        loading,
        error,
        createArticle,
        approveArticle,
        searchKB,
        getArticles,
        deleteArticle,
        getVersionHistory,
        getArticle,
        updateArticle
    }
} 