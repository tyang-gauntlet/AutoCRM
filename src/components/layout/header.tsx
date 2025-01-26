'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_REDIRECTS } from '@/constants/auth'

export function Header() {
    const { user, signOut, loading: authLoading } = useAuth()
    const { role, loading: roleLoading, error } = useRole()
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

    if (authLoading || roleLoading) {
        return (
            <nav className="border-b">
                <div className="flex h-16 items-center px-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            </nav>
        )
    }

    if (!user) return null

    return (
        <nav className="border-b">
            <div className="flex h-16 items-center px-4">
                <Link href={ROLE_REDIRECTS[role]}>
                    <h1 className="text-xl font-bold">AutoCRM</h1>
                </Link>

                <div className="ml-auto flex items-center space-x-4">
                    {error && (
                        <span className="text-sm text-destructive">{error}</span>
                    )}
                    <div className="text-sm text-muted-foreground mr-4">
                        <span className="font-medium text-foreground">{user.email}</span>
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
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
    )
} 