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
            console.log('[AuthContext] Fetching profile:', userId)
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('[AuthContext] Profile fetch error:', error)
                if (error.code === 'PGRST116') {
                    console.log('[AuthContext] Creating new profile for:', userId)
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([{ id: userId, role: 'user' }])
                        .select()
                        .single()

                    if (createError) throw createError
                    return newProfile
                }
                throw error
            }
            console.log('[AuthContext] Profile fetched:', profile)
            return profile
        } catch (error) {
            console.error('[AuthContext] Profile error:', error)
            return null
        }
    }

    useEffect(() => {
        console.log('[AuthContext] Initializing auth...')

        const initAuth = async () => {
            try {
                console.log('[AuthContext] Getting initial session...')
                const { data: { session }, error } = await supabase.auth.getSession()

                console.log('[AuthContext] Initial session:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    userRole: session?.user?.app_metadata?.role,
                    accessToken: session?.access_token?.slice(-10)
                })

                if (session?.user) {
                    setUser(session.user)
                    const profile = await fetchProfile(session.user.id)
                    setProfile(profile)
                }
            } catch (error) {
                console.error('[AuthContext] Init error:', error)
                setError(error instanceof Error ? error.message : 'Auth failed')
            } finally {
                setLoading(false)
                setInitialized(true)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[AuthContext] Auth state change:', {
                    event,
                    userId: session?.user?.id,
                    userRole: session?.user?.app_metadata?.role,
                    hasAccessToken: !!session?.access_token
                })

                if (session?.user) {
                    setUser(session.user)
                    const profile = await fetchProfile(session.user.id)
                    setProfile(profile)
                } else {
                    setUser(null)
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => {
            console.log('[AuthContext] Cleaning up auth subscription')
            subscription.unsubscribe()
        }
    }, [])

    // Log state changes
    useEffect(() => {
        console.log('[AuthContext] State updated:', {
            hasUser: !!user,
            userId: user?.id,
            userRole: user?.app_metadata?.role,
            hasProfile: !!profile,
            profileRole: profile?.role,
            loading,
            error
        })
    }, [user, profile, loading, error])

    // Don't render until fully initialized
    if (!initialized) {
        return null
    }

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error

            // Set session in cookie
            if (data.session) {
                // Store the full session in localStorage
                localStorage.setItem('supabase.auth.token', JSON.stringify({
                    access_token: data.session.access_token,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    refresh_token: data.session.refresh_token
                }))

                // Set access token in cookie for middleware
                document.cookie = `sb-access-token=${data.session.access_token};path=/;max-age=3600;SameSite=Lax`
            }

            // Get redirect path based on role
            const userRole = data.user?.app_metadata?.role || 'user'
            const dashboardPaths = {
                admin: '/admin/dashboard',
                reviewer: '/reviewer/dashboard',
                user: '/user/dashboard'
            }

            // Force a full page navigation
            window.location.href = dashboardPaths[userRole as keyof typeof dashboardPaths] || '/user/dashboard'
        } catch (error) {
            console.error('[AuthContext] Sign in error:', error)
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