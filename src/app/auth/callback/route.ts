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
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('[Auth Callback] Error:', error)
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Redirect to root to let middleware handle the role-based redirect
        const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'
        return NextResponse.redirect(new URL(redirectTo, request.url))
    } catch (error) {
        console.error('[Auth Callback] Error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}
