'use client'

import { useAuth } from '@/hooks/useAuth'

export const dynamic = 'force-dynamic'

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading } = useAuth()

    if (loading) return null

    return (
        <div className="min-h-screen bg-background">
            {/* User-specific navigation and layout */}
            {children}
        </div>
    )
} 