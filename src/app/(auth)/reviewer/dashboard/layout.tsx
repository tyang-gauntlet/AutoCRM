'use client'

import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { loading, user, profile } = useAuth()

    useEffect(() => {
        console.log('[Reviewer Dashboard] Auth State:', {
            loading,
            userExists: !!user,
            userId: user?.id,
            userEmail: user?.email,
            profileExists: !!profile,
            profileId: profile?.id,
            timestamp: new Date().toISOString(),
        })
    }, [loading, user, profile])

    if (loading) {
        console.log('[Reviewer Dashboard] Loading state...', {
            timestamp: new Date().toISOString(),
        })
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) {
        console.log('[Reviewer Dashboard] No user found', {
            timestamp: new Date().toISOString(),
        })
        return null
    }

    console.log('[Reviewer Dashboard] Rendering content', {
        userId: user.id,
        userEmail: user.email,
        hasProfile: !!profile,
        timestamp: new Date().toISOString(),
    })
    return (
        <div className="flex h-screen">
            {children}
        </div>
    )
} 