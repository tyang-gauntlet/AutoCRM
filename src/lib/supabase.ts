import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance that can be reused
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
    if (supabaseInstance) return supabaseInstance

    supabaseInstance = createClient<Database>(
        supabaseUrl,
        supabaseKey,
        {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
                storageKey: 'autocrm-auth-token', // Add a unique storage key
            },
        }
    )

    return supabaseInstance
})() 