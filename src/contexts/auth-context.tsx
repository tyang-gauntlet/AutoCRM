'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'
interface AuthContextType {
    user: User | null
    profile: Database['public']['Tables']['profiles']['Row'] | null
    loading: boolean
    error: string | null
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    signIn: async () => { },
    signOut: async () => { },
    signUp: async () => { }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [initialized, setInitialized] = useState(false)


    const fetchProfile = async (userId: string) => {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('[Auth] Profile fetch error:', error)
                if (error.code === 'PGRST116') {
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: userId,
                                role: 'user',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }
                        ])
                        .select()
                        .single()

                    if (createError) throw createError
                    return newProfile
                }
                throw error
            }
            return profile
        } catch (error) {
            console.error('[Auth] Profile fetch error:', error)
            return null
        }
    }

    useEffect(() => {
        let mounted = true

        const initAuth = async () => {
            try {
                if (!supabase) {
                    throw new Error('Supabase client not initialized')
                }
                const { data: { session } } = await supabase.auth.getSession()

                if (!mounted) return

                if (session?.user) {
                    setUser(session.user)
                    const profile = await fetchProfile(session.user.id)
                    if (mounted) {
                        setProfile(profile)
                    }
                }
            } catch (error) {
                console.error('[Auth] Init error:', error)
                if (mounted) {
                    setError(error instanceof Error ? error.message : 'Authentication failed')
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                    setInitialized(true)
                }
            }
        }

        initAuth()

        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] State change:', { event, userId: session?.user?.id })

                if (!mounted) return

                setUser(session?.user ?? null)

                if (session?.user) {
                    const profile = await fetchProfile(session.user.id)
                    if (mounted) {
                        setProfile(profile)
                    }
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    // Don't render anything until we've initialized
    if (!initialized) {
        return null
    }

    const signIn = async (email: string, password: string) => {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error

            // Get user role from metadata
            const userRole = data.user?.app_metadata?.role || 'user'

            // Set both tokens in cookies with proper expiry
            const accessExpiry = 3600 // 1 hour
            const refreshExpiry = 7200 // 2 hours
            document.cookie = `sb-access-token=${data.session?.access_token};path=/;max-age=${accessExpiry};SameSite=Lax`
            if (data.session?.refresh_token) {
                document.cookie = `sb-refresh-token=${data.session.refresh_token};path=/;max-age=${refreshExpiry};SameSite=Lax`
            }

            // Get redirect path from URL or use role-based default
            const params = new URLSearchParams(window.location.search)
            const from = params.get('from')

            // Role-based dashboard paths
            const dashboardPaths = {
                admin: '/admin/dashboard',
                reviewer: '/reviewer/dashboard',
                user: '/user/dashboard'
            }

            // Use the 'from' path if it exists and is valid, otherwise use role-based dashboard
            const redirectTo = (from && !from.startsWith('/login'))
                ? from
                : dashboardPaths[userRole as keyof typeof dashboardPaths] || dashboardPaths.user

            // Force a full page navigation
            window.location.href = redirectTo
        } catch (error) {
            console.error('[Auth] Sign in error:', error)
            throw error
        }
    }

    const signOut = async () => {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            await supabase.auth.signOut()
            // Clear auth cookies
            document.cookie = 'sb-access-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
            document.cookie = 'sb-refresh-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
            window.location.href = '/login'
        } catch (error) {
            console.error('[Auth] Sign out error:', error)
            window.location.href = '/login'
        }
    }

    const signUp = async (email: string, password: string) => {
        try {
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'user' // Default role for new signups
                    }
                }
            })
            if (error) throw error
        } catch (error) {
            console.error('[Auth] Sign up error:', error)
            throw error
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            error,
            signIn,
            signOut,
            signUp
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}