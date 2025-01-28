import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type UserStats = {
    totalUsers: number
    activeToday: number
    adminCount: number
    supportCount: number
}

export function useUserStats() {
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeToday: 0,
        adminCount: 0,
        supportCount: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = async () => {
        try {
            setError(null)
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setLoading(true)
                return
            }

            // Get total users count
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            // Get active users today (users who have logged in in the last 24 hours)
            const oneDayAgo = new Date()
            oneDayAgo.setDate(oneDayAgo.getDate() - 1)
            const { count: activeToday } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('last_sign_in_at', oneDayAgo.toISOString())

            // Get admin count
            const { count: adminCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'admin')

            // Get support staff count
            const { count: supportCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'reviewer')

            setStats({
                totalUsers: totalUsers || 0,
                activeToday: activeToday || 0,
                adminCount: adminCount || 0,
                supportCount: supportCount || 0
            })
        } catch (error) {
            console.error('Error fetching user stats:', error)
            setError('Failed to fetch user statistics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        // Set up real-time subscription for changes
        if (!supabase) {
            throw new Error('Supabase client not initialized')
        }
        const channel = supabase
            .channel('user-stats')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles'
            }, () => {
                fetchStats()
            })
            .subscribe()

        return () => {
            if (!supabase) {
                throw new Error('Supabase client not initialized')
            }
            supabase.removeChannel(channel)
        }
    }, [])

    return {
        stats,
        loading,
        error,
        refreshStats: fetchStats
    }
} 