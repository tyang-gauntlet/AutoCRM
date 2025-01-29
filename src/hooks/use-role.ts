'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type RoleState = {
    role: string | null
    loading: boolean
}

export function useRole() {
    const [state, setState] = useState<RoleState>({
        role: null,
        loading: true
    })

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
                    .select('*')
                    .eq('id', session.user.id)

                setState({
                    role: profile?.[0]?.role || null,
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