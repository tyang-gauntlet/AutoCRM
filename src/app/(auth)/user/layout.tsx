'use client'

import { useAuth } from '@/contexts/auth-context'

export const dynamic = 'force-dynamic'

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading } = useAuth()

    if (loading) return null

    return (
        <div className=" bg-background">
            {/* User-specific navigation and layout */}
            {children}
        </div>
    )
} 