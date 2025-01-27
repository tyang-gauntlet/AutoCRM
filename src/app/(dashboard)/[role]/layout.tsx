'use client'

import { useRole } from '@/hooks/use-role'
import { useRouter } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
    children,
    params
}: PropsWithChildren<{ params: { role: string } }>) {
    const { role, loading } = useRole()
    const router = useRouter()

    if (loading) {
        return <div>Loading layout...</div>
    }

    if (role && role !== params.role) {
        router.push(`/${role}/dashboard`)
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {children}
            </main>
        </div>
    )
} 