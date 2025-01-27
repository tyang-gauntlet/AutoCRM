'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

type RoleState = {
    role: string | null
    loading: boolean
}

export function useRole() {
    const [state, setState] = useState<RoleState>({
        role: null,
        loading: true
    })
    const supabase = createClientComponentClient<Database>()

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.user) {
                    setState({ role: null, loading: false })
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                setState({
                    role: profile?.role || null,
                    loading: false
                })
            } catch (error) {
                setState({ role: null, loading: false })
            }
        }

        fetchRole()
    }, [])

    return state
}