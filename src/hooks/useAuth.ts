'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'

export function useAuth() {
    const [user, setUser] = useState<null | User>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient()

    // Handle auth state changes
    const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
            setUser(null)
            setLoading(false)
            // Clear all local storage and cookies
            localStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
            // Don't redirect if already on login page
            if (window.location.pathname !== '/login') {
                window.location.replace('/login')
            }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user ?? null)
            setLoading(false)
        }
    }, [])

    // Initialize auth state
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('[useAuth] Error getting session:', error)
                    setUser(null)
                    setLoading(false)
                    return
                }

                setUser(session?.user ?? null)
                setLoading(false)

                // Only redirect if not on a public route
                const isPublicRoute = ['/login', '/signup', '/forgot-password', '/'].includes(window.location.pathname)

                if (!session && !isPublicRoute) {
                    window.location.replace('/login')
                }
            } catch (error) {
                console.error('[useAuth] Error checking session:', error)
                setUser(null)
                setLoading(false)
            }
        }

        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
        return () => {
            subscription.unsubscribe()
        }
    }, [handleAuthStateChange, supabase.auth])

    const signOut = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('[useAuth] Error signing out:', error)
            }

            // Clear all local storage and cookies regardless of signOut success
            localStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })

            setUser(null)
            window.location.replace('/login')
        } catch (error) {
            console.error('[useAuth] Error signing out:', error)
            // Still redirect to login on error
            window.location.replace('/login')
        }
    }, [supabase.auth])

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('[useAuth] Signup error:', error)
            throw error
        }

        return data
    }

    return {
        user,
        loading,
        signOut,
        signUp,
    }
}