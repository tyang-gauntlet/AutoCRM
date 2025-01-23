import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const requestUrl = new URL(request.url)
        const code = requestUrl.searchParams.get('code')

        if (!code) {
            console.error('[Auth Callback] No code provided')
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        // Exchange the code for a session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('[Auth Callback] Error exchanging code for session:', error)
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (!session) {
            console.error('[Auth Callback] No session returned')
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Get user role and redirect accordingly
        const userRole = session.user?.app_metadata?.role || 'user'
        let redirectPath: string

        switch (userRole) {
            case 'admin':
                redirectPath = '/admin/dashboard'
                break
            case 'reviewer':
                redirectPath = '/reviewer/dashboard'
                break
            default:
                redirectPath = '/user/dashboard'
        }

        return NextResponse.redirect(new URL(redirectPath, request.url))
    } catch (error) {
        console.error('[Auth Callback] Unexpected error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}
