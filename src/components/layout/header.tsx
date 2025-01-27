'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRole } from '@/hooks/use-role'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'

export function Header() {
    const { user, loading: authLoading } = useAuthContext()
    const { role } = useRole()
    const { signOut } = useAuth()
    const router = useRouter()
    const [isSigningOut, setIsSigningOut] = useState(false)

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
            <header role="banner">
                <nav className="border-b" aria-label="Main navigation">
                    <div className="flex h-16 items-center px-4">
                        <Loader2
                            className="h-5 w-5 animate-spin"
                            role="status"
                            aria-label="Loading"
                        />
                    </div>
                </nav>
            </header>
        )
    }

    if (!user) return null

    const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            role="banner"
        >
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link
                        href="/"
                        className="mr-6 flex items-center space-x-2"
                        aria-label="Go to homepage"
                    >
                        <span className="font-bold">AutoCRM</span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground" aria-label="User email">
                            {user.email}
                        </span>
                        <span
                            className="rounded-full bg-muted px-2 py-1 text-xs font-medium"
                            aria-label="User role"
                        >
                            {displayRole}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            aria-label="Sign out"
                            data-testid="logout-button"
                        >
                            {isSigningOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                            <span className="sr-only">Sign out</span>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
} 