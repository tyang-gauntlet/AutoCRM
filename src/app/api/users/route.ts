export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'


export async function GET() {
    try {
        const { data: { session } } = await supabase.auth.getSession()


        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get users who can be assigned tickets (admins and support staff)
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, email')
            .in('role', ['admin', 'support'])
            .order('email')

        if (error) throw error

        return NextResponse.json({ users })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Error fetching users' },
            { status: 500 }
        )
    }
} 