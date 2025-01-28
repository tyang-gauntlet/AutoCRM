'use client'

import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { loading } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-screen">
            {children}
        </div>
    )
} 