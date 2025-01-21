'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, UserRole } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useUsers() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClientComponentClient<Database>()

    const fetchUsers = async () => {
        try {
            setError(null)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setLoading(false)
                return
            }

            // First check if user is admin
            const { data: currentUser, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (profileError) {
                console.error('Error checking user role:', profileError)
                setError('Error checking permissions')
                setLoading(false)
                return
            }

            if (currentUser.role !== 'admin') {
                setError('Unauthorized')
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching users:', error)
                setError('Error fetching users')
                return
            }

            setUsers(data || [])
        } catch (error) {
            console.error('Error in fetchUsers:', error)
            setError('Unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) {
                console.error('Error updating role:', error)
                return { error }
            }

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? { ...user, role: newRole }
                        : user
                )
            )
            return { error: null }
        } catch (error) {
            console.error('Error in updateUserRole:', error)
            return { error }
        }
    }

    const deactivateUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'inactive' })
                .eq('id', userId)

            if (!error) {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.id === userId
                            ? { ...user, status: 'inactive' }
                            : user
                    )
                )
            }
            return { error }
        } catch (error) {
            console.error('Error in deactivateUser:', error)
            return { error }
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    return {
        users,
        loading,
        error,
        updateUserRole,
        deactivateUser,
        refreshUsers: fetchUsers
    }
} 