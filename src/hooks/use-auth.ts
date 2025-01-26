'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { PUBLIC_ROUTES } from '@/constants/auth'
import type { AuthState, AuthActions } from '@/types/auth'

type SignUpResponse = {
    data: { user: User | null; session: Session | null } | null;
    error: Error | null;
}

export function useAuth(): AuthState & AuthActions {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClientComponentClient<Database>()
    const [session, setSession] = useState<Session | null>(null)
    const sessionCache = useRef<{ [key: string]: Session }>({})

    const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
            setUser(null)
            setError(null)
            // Clear client-side data
            localStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
            // Only refresh if not already on a public route
            const isPublicRoute = PUBLIC_ROUTES.includes(window.location.pathname as typeof PUBLIC_ROUTES[number])
            if (!isPublicRoute) {
                router.refresh()
            }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(session?.user ?? null)
            setError(null)
            router.refresh()
        }
        setLoading(false)
    }, [router])

    const getSession = useCallback(async () => {
        const cachedSession = sessionCache.current['current']
        if (cachedSession) {
            return cachedSession
        }

        const response = await fetch('/api/auth/session')
        const data = await response.json()

        sessionCache.current['current'] = data
        setSession(data)
        return data
    }, [])

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) throw sessionError
                setUser(session?.user ?? null)
                setLoading(false)
            } catch (error) {
                console.error('[useAuth] Error checking session:', error)
                setUser(null)
                setError(error instanceof Error ? error.message : 'Failed to check session')
                setLoading(false)
            }
        }

        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
        return () => subscription.unsubscribe()
    }, [handleAuthStateChange, supabase.auth])

    const signOut = useCallback(async () => {
        try {
            setLoading(true)
            const { error: signOutError } = await supabase.auth.signOut()
            if (signOutError) throw signOutError

            // Clear client-side data
            localStorage.clear()

            // Clear cookies
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=localhost")
            })

            // Navigate to login if not on public route
            const isPublicRoute = PUBLIC_ROUTES.includes(window.location.pathname as typeof PUBLIC_ROUTES[number])
            if (!isPublicRoute) {
                router.push('/login')
            }
        } catch (error) {
            console.error('[useAuth] Error signing out:', error)
            setError('Failed to sign out')
            throw error
        } finally {
            setLoading(false)
        }
    }, [router, supabase.auth])

    const signUp = async (email: string, password: string): Promise<SignUpResponse> => {
        try {
            setLoading(true)

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: { role: 'user' }
                }
            })

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            console.error('Signup error:', error)
            return { data: null, error: error as Error }
        } finally {
            setLoading(false)
        }
    }

    return {
        user,
        loading,
        error,
        signIn: async (email: string, password: string) => {
            try {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (signInError) throw signInError
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to sign in')
                throw error
            }
        },
        signOut,
        signUp
    }
}