import { useCallback, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useAuth() {
    const [user, setUser] = useState<null | { email?: string }>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient()

    useEffect(() => {
        // Check session on mount
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
        }

        checkSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setUser(null)
        window.location.replace('/login')
    }, [supabase.auth])

    return {
        user,
        loading,
        signOut,
    }
}
