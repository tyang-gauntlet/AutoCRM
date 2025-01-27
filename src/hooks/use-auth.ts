'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuthContext } from '@/contexts/auth-context'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

type AuthState = {
    loading: boolean
    error: string | null
}

type AuthActions = {
    user: User | null
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<{ error?: Error }>
    signOut: () => Promise<void>
}

export function useAuth(): AuthState & AuthActions {
    const { user, loading: authLoading } = useAuthContext()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClientComponentClient<Database>()

    const signIn = async (email: string, password: string) => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to sign in')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const signUp = async (email: string, password: string) => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error
            return {}
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to sign up')
            return { error: error instanceof Error ? error : new Error('Failed to sign up') }
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            // Force a router refresh and redirect to login
            router.refresh()
            router.push('/login')
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        }
    }

    return {
        user,
        loading: loading || authLoading,
        error,
        signIn,
        signUp,
        signOut,
    }
}