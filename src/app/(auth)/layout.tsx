'use client'

import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-background">
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
    )
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth()

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto">
                {children}
            </main>
        </div>
    )
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AuthLayoutContent>{children}</AuthLayoutContent>
        </Suspense>
    )
}
