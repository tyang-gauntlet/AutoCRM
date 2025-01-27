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
        <header>
            <nav className="border-b">
                <div className="flex h-16 items-center px-4">
                    <Link href={`/${role}/dashboard`}>
                        <h1 className="text-xl font-bold">AutoCRM</h1>
                    </Link>

                    <div className="ml-auto flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground mr-4">
                            <span className="font-medium text-foreground">{userInfo.email}</span>
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {displayRole}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            aria-label="Sign out"
                        >
                            {isSigningOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </nav>
        </header>
    )
} 