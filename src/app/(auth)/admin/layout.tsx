'use client'

import { useAuth } from '@/hooks/use-auth'

export const dynamic = 'force-dynamic'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading } = useAuth()

    if (loading) return null

    return (
        <div className="min-h-screen bg-background">
            {/* Admin-specific navigation and layout */}
            {children}
        </div>
    )
} 