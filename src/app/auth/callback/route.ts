import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        // Get user role and redirect accordingly
        const userRole = session?.user?.app_metadata?.role || 'user'
        const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'

        return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // If no code, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
}
