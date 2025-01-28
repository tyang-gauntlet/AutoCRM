'use client'

import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { loading } = useAuth()
    console.log('🟣 Admin Dashboard Layout: Loading state:', loading)

    if (loading) {
        console.log('🟣 Admin Dashboard Layout: Showing loading spinner')
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    console.log('🟣 Admin Dashboard Layout: Rendering children')
    return <>{children}</>
} 