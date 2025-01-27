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
            <div className="min-h-screen bg-background" data-testid="layout">
                <Header />
                <div className="flex items-center justify-center h-screen">
                    <div role="status" aria-label="Loading">
                        Loading...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background" data-testid="layout">
            <Header />
            <main className="mx-auto" role="main">
                {children}
            </main>
        </div>
    )
}
