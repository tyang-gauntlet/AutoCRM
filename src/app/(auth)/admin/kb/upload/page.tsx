'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ArticleUpload } from '@/components/kb/article-upload'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

export default function UploadPage() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)

    useEffect(() => {
        console.log('[UploadPage] Auth state:', {
            userId: user?.id,
            userRole: user?.app_metadata?.role,
            profileId: profile?.id,
            profileRole: profile?.role,
            loading
        })
        if (!loading && (!user || (user.app_metadata.role !== 'admin' && profile?.role !== 'admin'))) {
            console.log('[UploadPage] Redirecting to login - not admin')
            router.push('/login')
        }
    }, [user, profile, loading, router])

    useEffect(() => {
        async function loadCategories() {
            console.log('[UploadPage] Starting to load categories...')
            try {
                // First check if the table exists and has data
                const { count, error: countError } = await supabase
                    .from('kb_categories')
                    .select('*', { count: 'exact', head: true })

                console.log('[UploadPage] Table data check:', {
                    totalCount: count,
                    error: countError
                })

                // Check auth state before query
                const { data: { session } } = await supabase.auth.getSession()
                console.log('[UploadPage] Auth check before query:', {
                    hasSession: !!session,
                    accessToken: session?.access_token ? 'present' : 'missing',
                    userId: session?.user?.id,
                    userRole: session?.user?.role
                })

                console.log('[UploadPage] Making Supabase query to kb_categories table')
                const { data, error } = await supabase
                    .from('kb_categories')
                    .select('id, name')
                    .order('name')

                if (error) {
                    console.error('[UploadPage] Supabase error loading categories:', {
                        code: error.code,
                        message: error.message,
                        details: error.details
                    })
                    throw error
                }

                console.log('[UploadPage] Categories loaded successfully:', {
                    count: data?.length || 0,
                    categories: data
                })
                setCategories(data || [])
            } catch (error) {
                console.error('[UploadPage] Error in loadCategories:', error)
                if (error instanceof Error) {
                    console.error('[UploadPage] Error details:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    })
                }
            } finally {
                console.log('[UploadPage] Finished loading categories')
                setLoadingCategories(false)
            }
        }

        if (!loading && user) {
            console.log('[UploadPage] Initiating category load')
            loadCategories()
        }
    }, [loading, user])

    if (loading || loadingCategories) {
        console.log('[UploadPage] Loading state:', {
            authLoading: loading,
            categoriesLoading: loadingCategories,
            categoriesCount: categories.length,
            hasCategories: categories.length > 0
        })
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    if (!user || (user.app_metadata.role !== 'admin' && profile?.role !== 'admin')) {
        console.log('[UploadPage] User check failed:', {
            userId: user?.id,
            userRole: user?.app_metadata?.role,
            profileRole: profile?.role,
            hasCategories: categories.length > 0
        })
        return null
    }

    console.log('[UploadPage] Rendering with categories:', {
        count: categories.length,
        categories: categories,
        authState: {
            userId: user?.id,
            userRole: user?.app_metadata?.role,
            profileRole: profile?.role
        }
    })
    return (
        <main className="container mx-auto p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Upload Knowledge Base Article</h1>
                <Card className="p-6">
                    <ArticleUpload categories={categories} />
                </Card>
            </div>
        </main>
    )
} 