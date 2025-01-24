'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()

    useEffect(() => {
        if (!loading && !user) {
            const isPublicRoute = ['/login', '/signup', '/forgot-password', '/'].includes(window.location.pathname)
            if (!isPublicRoute) {
                window.location.replace('/login')
            }
        }
    }, [user, loading])

    // Check role and redirect if needed
    useEffect(() => {
        if (user) {
            const supabase = createClientComponentClient()

            // Fetch user's role from profiles
            const fetchRole = async () => {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                const userRole = profile?.role || 'user'
                const path = window.location.pathname

                // Updated role-based routing
                switch (userRole) {
                    case 'admin':
                        if (path.startsWith('/user') || path.startsWith('/reviewer')) {
                            window.location.replace('/admin/dashboard')
                        }
                        break
                    case 'reviewer':
                        if (path.startsWith('/user') || path.startsWith('/admin')) {
                            window.location.replace('/reviewer/dashboard')
                        }
                        break
                    case 'user':
                        if (path.startsWith('/admin') || path.startsWith('/reviewer')) {
                            window.location.replace('/user/dashboard')
                        }
                        break
                }
            }

            fetchRole()
        }
    }, [user])

    if (loading || !user) return null

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {children}
        </div>
    )
}
