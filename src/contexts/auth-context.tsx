'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AuthContextType = {
    user: User | null
    session: Session | null
    loading: boolean
    initialized: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    initialized: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        console.log('🔐 [AuthProvider] Initializing...')

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                console.log('🔐 [AuthProvider] Session loaded:', !!session)
                if (session) {
                    setUser(session.user)
                    setSession(session)
                }
            } catch (error) {
                console.error('🔐 [AuthProvider] Init error:', error)
            } finally {
                setLoading(false)
                setInitialized(true)
                console.log('🔐 [AuthProvider] Initialization complete')
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 [AuthProvider] Auth state change:', event)
            setUser(session?.user ?? null)
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    return (
        <AuthContext.Provider value={{ user, session, loading, initialized }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = () => useContext(AuthContext) 