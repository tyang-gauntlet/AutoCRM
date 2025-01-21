'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export function useAuth() {
    const [user, setUser] = useState<null | any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClientComponentClient()

    // Handle auth state changes
    const handleAuthStateChange = useCallback(async (event: string, session: any) => {
        console.log('Auth state changed:', event)
        if (event === 'SIGNED_OUT') {
            setUser(null)
            setLoading(false)
            // Don't redirect if already on login page
            if (window.location.pathname !== '/login') {
                window.location.replace('/login')
            }
        } else {
            setUser(session?.user ?? null)
            setLoading(false)
        }
    }, [])

    // Initialize auth state
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
                setLoading(false)

                // Only redirect if not on a public route
                const isPublicRoute = ['/login', '/signup', '/forgot-password', '/'].includes(window.location.pathname)
                if (!session && !isPublicRoute) {
                    window.location.replace('/login')
                }
            } catch (error) {
                console.error('Error checking session:', error)
                setLoading(false)
            }
        }

        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
        return () => subscription.unsubscribe()
    }, [handleAuthStateChange])

    const signOut = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            localStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
            setUser(null)
            window.location.replace('/login')
        } catch (error) {
            console.error('Error signing out:', error)
            window.location.replace('/login')
        }
    }, [supabase.auth])

    return {
        user,
        loading,
        signOut,
    }
}
