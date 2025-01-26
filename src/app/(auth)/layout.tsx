'use client'

import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/layout/header'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading } = useAuth()

    if (loading) return null

    return (
        <div className="min-h-screen bg-background">
            <Header />
            {children}
        </div>
    )
}
