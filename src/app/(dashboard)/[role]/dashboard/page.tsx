'use client'

import { useRole } from '@/hooks/use-role'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TicketList } from '@/components/tickets/ticket-list'

export default function DashboardPage({ params }: { params: { role: string } }) {
    const { role, loading } = useRole()
    const router = useRouter()

    // Add debug logging
    useEffect(() => {
        console.log('Dashboard state:', { role, loading, params })
    }, [role, loading, params])

    // Show loading state
    if (loading) {
        return <div>Loading dashboard...</div>
    }

    // Redirect if role doesn't match
    if (role && role !== params.role) {
        console.log('Role mismatch, redirecting:', { current: role, requested: params.role })
        router.push(`/${role}/dashboard`)
        return null
    }

    // Format role for display
    const displayRole = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : 'User' // Fallback to 'User' if role is null/undefined

    // Render appropriate dashboard based on role
    return (
        <main>
            <div className="flex h-screen">
                <TicketList />
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a ticket to view details
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
} 