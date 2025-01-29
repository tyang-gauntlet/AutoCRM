'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
    user: User | null
    profile: Database['public']['Tables']['profiles']['Row'] | null
    loading: boolean
    profileLoading: boolean
    error: string | null
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    profileLoading: false,
    error: null,
    signIn: async () => { },
    signOut: async () => { },
    signUp: async () => { }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
    const [userLoading, setUserLoading] = useState(true)
    const [profileLoading, setProfileLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = async (userId: string) => {
        try {
            setProfileLoading(true)
            console.log('[AuthContext] Fetching profile:', userId)
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('[AuthContext] Profile fetch error:', error)
                throw error
            }

            console.log('[AuthContext] Profile fetched successfully:', profile)
            setProfile(profile)
            return profile
        } catch (error) {
            console.error('[AuthContext] Profile error:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch profile')
            return null
        } finally {
            setProfileLoading(false)
        }
    }

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setUser(session.user)
                    fetchProfile(session.user.id)
                } else {
                    setUser(null)
                }
            } finally {
                setUserLoading(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user)
                    fetchProfile(session.user.id)
                } else {
                    setUser(null)
                    setProfile(null)
                }
                setUserLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

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
            loading: userLoading,
            profileLoading,
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