'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRole } from '@/hooks/use-role'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'
import { UserMenu } from './user-menu'

export function Header() {
    const { user, loading: authLoading } = useAuthContext()
    const { role } = useRole()
    const { signOut } = useAuth()
    const router = useRouter()
    const [isSigningOut, setIsSigningOut] = useState(false)

    // Memoize expensive computations
    const userInfo = useMemo(() => ({
        email: user?.email,
        role: role || 'user'
    }), [user, role])

    const handleSignOut = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (isSigningOut) return

        setIsSigningOut(true)
        try {
            await signOut()
            router.refresh()
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            setIsSigningOut(false)
        }
    }

    if (authLoading) {
        return (
            <header>
                <nav className="border-b">
                    <div className="flex h-16 items-center px-4">
                        <Loader2 className="h-5 w-5 animate-spin" role="status" aria-label="Loading" />
                    </div>
                </nav>
            </header>
        )
    }

    if (!user) return null

    const displayRole = userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="font-bold">Support Dashboard</span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <UserMenu />
                </div>
            </div>
        </header>
    )
} 