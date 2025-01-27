'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { useAuth } from './use-auth'

export function useRole() {
    const { user, loading: authLoading } = useAuth()
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        console.log('👤 [useRole] Effect triggered:', { userId: user?.id, authLoading })

        async function fetchRole() {
            if (!user?.id) {
                console.log('👤 [useRole] No user ID, setting null role')
                setRole(null)
                setLoading(false)
                return
            }

            try {
                console.log('👤 [useRole] Fetching role for user:', user.id)
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (error) throw error
                const newRole = profile?.role || 'user'
                console.log('👤 [useRole] Role fetched:', newRole)
                setRole(newRole)
            } catch (error) {
                console.error('👤 [useRole] Error fetching role:', error)
                setRole('user')
            } finally {
                console.log('👤 [useRole] Setting loading false')
                setLoading(false)
            }
        }

        if (!authLoading) {
            console.log('👤 [useRole] Auth not loading, fetching role')
            fetchRole()
        } else {
            console.log('👤 [useRole] Auth still loading, waiting...')
        }
    }, [user?.id, authLoading, supabase])

    const finalLoading = loading || authLoading
    console.log('👤 [useRole] Returning state:', { role, loading: finalLoading })

    return {
        role,
        loading: finalLoading,
        isAdmin: role === 'admin',
        isReviewer: role === 'reviewer',
        isUser: role === 'user'
    }
} 