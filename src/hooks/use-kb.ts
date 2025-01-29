import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CreateArticleRequest, UpdateArticleRequest, ArticleStatus } from '@/types/kb'

export function useKB() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleError = (err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(message)
        throw err
    }

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
            handleError(err)
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
            handleError(err)
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
            handleError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    const getArticles = useCallback(async (params?: {
        search?: string
        status?: ArticleStatus
        category?: string
    }) => {
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
                .order('created_at', { ascending: false })

            if (error) throw error
            return data
        } catch (err) {
            handleError(err)
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
            handleError(err)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const getVersionHistory = useCallback(async (articleId: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('kb_articles')
                .select(`
                    *,
                    created_by:profiles(id, full_name)
                `)
                .eq('id', articleId)
                .order('version', { ascending: false })

            if (error) throw error
            return data
        } catch (err) {
            handleError(err)
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
            handleError(err)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const updateArticle = useCallback(async (id: string, data: UpdateArticleRequest) => {
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
            handleError(err)
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