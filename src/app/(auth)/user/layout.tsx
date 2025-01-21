'use client'

import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()

    if (loading) return null

    return (
        <div className="min-h-screen bg-background">
            {/* User-specific navigation and layout */}
            {children}
        </div>
    )
} 