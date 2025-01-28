import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance that can be reused
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
    if (supabaseInstance) return supabaseInstance

    supabaseInstance = createClient<Database, 'public', Database['public']>(
        supabaseUrl,
        supabaseKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                storage: {
                    getItem: (key) => {
                        try {
                            return localStorage.getItem(key)
                        } catch {
                            return null
                        }
                    },
                    setItem: (key, value) => {
                        try {
                            localStorage.setItem(key, value)
                            // Set just the access token in the cookie
                            const session = JSON.parse(value)
                            if (session?.access_token) {
                                document.cookie = `sb-access-token=${session.access_token};path=/;max-age=3600;SameSite=Lax`
                            }
                        } catch {
                            // Ignore storage errors
                        }
                    },
                    removeItem: (key) => {
                        try {
                            localStorage.removeItem(key)
                            document.cookie = `sb-access-token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`
                        } catch {
                            // Ignore storage errors
                        }
                    },
                },
            },
        }
    )

    return supabaseInstance
})() 