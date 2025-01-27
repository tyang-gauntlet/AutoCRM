'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import type { AuthState, AuthActions } from '@/types/auth'

type SignUpResponse = {
    data: { user: User | null; session: Session | null } | null;
    error: Error | null;
}

export function useAuth(): AuthState & AuthActions {
    const { user, session, loading: authLoading } = useAuthContext()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClientComponentClient<Database>()
    const redirecting = useRef(false)
    const pathname = usePathname()

    const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
            setError(null)
            // Clear client-side data
            localStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
            })
            if (!redirecting.current) {
                redirecting.current = true
                router.push('/login')
            }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (!session?.user?.id) return

            setError(null)

            if (!redirecting.current) {
                redirecting.current = true
                try {
                    // Get user role from profile
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (profileError) throw profileError

                    // Redirect based on role
                    const role = profile?.role || 'user'
                    router.push(`/${role}/dashboard`)
                } catch (error) {
                    console.error('Error fetching user role:', error)
                    // Fallback to user dashboard on error
                    router.push('/user/dashboard')
                }
            }
        }
        setLoading(false)
    }, [router, supabase])

    useEffect(() => {
        redirecting.current = false
    }, [pathname])

    const signOut = useCallback(async () => {
        try {
            setLoading(true)
            const { error: signOutError } = await supabase.auth.signOut()
            if (signOutError) throw signOutError

            // Clear client-side data
            localStorage.clear()
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=localhost")
            })

            router.push('/login')
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
                    data: {}
                }
            })

            if (error) throw error

            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        email: data.user.email,
                        role: 'user',
                        status: 'active'
                    }])

                if (profileError) throw profileError
            }

            return { data, error: null }
        } catch (error) {
            console.error('Signup error:', error)
            return { data: null, error: error as Error }
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error

            // Handle redirect after successful sign in
            if (data.session) {
                // Get user role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .single()

                const role = profile?.role || 'user'
                router.push(`/${role}/dashboard`)
            }
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
        }
    }

    return {
        user,
        loading: loading || authLoading,
        error,
        session,
        signIn,
        signOut,
        signUp
    }
}