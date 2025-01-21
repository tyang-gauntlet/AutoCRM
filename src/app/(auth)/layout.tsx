'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { Header } from '@/components/layout/header'

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
            const userRole = user.app_metadata?.role || 'user'
            const path = window.location.pathname

            if (userRole === 'admin' && path.startsWith('/user')) {
                window.location.replace('/admin/dashboard')
            } else if (userRole === 'user' && path.startsWith('/admin')) {
                window.location.replace('/user/dashboard')
            }
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
