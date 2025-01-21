'use client'

import * as React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Header() {
    const { user, signOut } = useAuth()
    const [isSigningOut, setIsSigningOut] = useState(false)

    // Only check app_metadata for role
    const isAdmin = user?.app_metadata?.role === 'admin'

    const handleSignOut = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (isSigningOut) return

        setIsSigningOut(true)
        try {
            await signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        }
        // Always reset the signing out state
        setIsSigningOut(false)
    }

    // Don't show header if no user
    if (!user) return null

    return (
        <nav className="border-b">
            <div className="flex h-16 items-center px-4">
                <Link href={isAdmin ? '/admin/dashboard' : '/user/dashboard'}>
                    <h1 className="text-xl font-bold">AutoCRM</h1>
                </Link>

                <div className="ml-auto flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground mr-4">
                        <span className="font-medium text-foreground">{user.email}</span>
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {isAdmin ? 'Admin' : 'User'}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings">
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>
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