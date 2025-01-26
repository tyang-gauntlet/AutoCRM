'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import type { UserRole } from '@/constants/auth'
import { useAuth } from './use-auth'

export function useRole() {
    const { user } = useAuth()
    const [role, setRole] = useState<UserRole>('user')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        if (user) {
            const fetchRole = async () => {
                try {
                    const { data: profile, error: dbError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (dbError) throw dbError
                    setRole((profile?.role || 'user') as UserRole)
                    setError(null)
                } catch (err) {
                    console.error('Error fetching user role:', err)
                    setError('Failed to load user role')
                } finally {
                    setLoading(false)
                }
            }

            fetchRole()
        } else {
            setRole('user')
            setLoading(false)
        }
    }, [user, supabase])

    return {
        role,
        loading,
        error,
        isAdmin: role === 'admin',
        isReviewer: role === 'reviewer',
        isUser: role === 'user'
    }
} 