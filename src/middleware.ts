import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback', '/']

export async function middleware(request: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh session if expired
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Auth condition
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup')

    if (session && isAuthPage) {
        // If logged in and trying to access auth page, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (!session && !isAuthPage && !request.nextUrl.pathname.startsWith('/auth')) {
        // If not logged in and trying to access protected page, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
