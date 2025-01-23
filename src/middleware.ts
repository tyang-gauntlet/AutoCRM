import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback', '/']

export async function middleware(request: NextRequest) {

    // Skip middleware for static files and api routes
    if (request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/favicon.ico')) {
        return NextResponse.next()
    }

    try {
        // Create a response early so we can modify headers
        const res = NextResponse.next()

        // Create middleware client using request/response
        const supabase = createMiddlewareClient({ req: request, res })

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            console.error('[Middleware] Error getting session:', error)
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const { pathname } = request.nextUrl

        // Check if the current route is public
        const isPublicRoute = PUBLIC_ROUTES.some(route =>
            pathname === route || pathname.startsWith('/auth/')
        )

        // If we have a session but trying to access public routes (except home)
        if (session && isPublicRoute && pathname !== '/') {
            const userRole = session.user.app_metadata?.role || 'user'
            const redirectUrl = new URL(userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard', request.url)
            return NextResponse.redirect(redirectUrl)
        }

        // If we don't have a session and trying to access protected routes
        if (!session && !isPublicRoute) {
            console.log('[Middleware] Redirecting unauthenticated user to login')
            return NextResponse.redirect(new URL('/login', request.url))
        }

        return res
    } catch (error) {
        console.error('[Middleware] Unexpected error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
