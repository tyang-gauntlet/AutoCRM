'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

interface AuthContextType {
    user: User | null
    profile: Database['public']['Tables']['profiles']['Row'] | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signIn: async () => { },
    signOut: async () => { }
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const supabase = createClientComponentClient<Database>()

    // Handle initial session
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setUser(session.user)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()
                    setProfile(profile)
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                setLoading(false)
                setInitialized(true)
            }
        }

        initializeAuth()
    }, [supabase])

    // Handle auth state changes
    useEffect(() => {
        if (!initialized) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)

                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()
                    setProfile(profile)
                } else {
                    setProfile(null)
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, initialized])

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            setUser(null)
            setProfile(null)
        } catch (error) {
            console.error('Sign out error:', error)
            throw error
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}