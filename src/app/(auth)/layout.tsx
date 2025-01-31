'use client'

import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/layout/header'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Only redirect if auth is finished loading and we have no user
        if (!loading && user === null) {
            router.push('/login')
        }
    }, [user, loading, router])

    // Show nothing while redirecting
    if (!loading && user === null) {
        return null
    }

    return (
        <div className="flex flex-col h-[calc(100vh-40rem)] bg-background">
            <Header />
            <main className="flex-1 w-full">
                <div className="h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
