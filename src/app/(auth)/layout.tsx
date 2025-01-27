'use client'

import { Header } from '@/components/layout/header'
import { useAuth } from '@/hooks/use-auth'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading } = useAuth()

    // Only show loading state, but still render layout
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center h-screen">
                    Loading...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto py-6">
                {children}
            </main>
        </div>
    )
}
