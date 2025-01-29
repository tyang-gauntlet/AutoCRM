'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, profile, profileLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Only redirect if we have profile and it's not a reviewer
        if (profile && profile.role !== 'reviewer') {
            router.push('/')
        }
    }, [profile, router])

    // Show skeleton loader while profile is loading
    if (profileLoading) {
        return (
            <div className="flex h-screen">
                <div className="flex-1 p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-1/4 bg-muted rounded" />
                        <div className="h-4 w-1/3 bg-muted rounded" />
                    </div>
                </div>
            </div>
        )
    }

    // Don't render anything while redirecting
    if (profile && profile.role !== 'reviewer') {
        return null
    }

    return (
        <div className="flex h-screen">
            {children}
        </div>
    )
} 