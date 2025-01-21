import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback', '/']

export async function middleware(request: NextRequest) {
    // Skip middleware for static files and api routes
    if (request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/favicon.ico')) {
        return NextResponse.next()
    }

    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const { data: { session } } = await supabase.auth.getSession()
    const { pathname } = request.nextUrl

    // Check if the current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith('/auth/')
    )

    // If we have a session but trying to access public routes (except home)
    if (session && isPublicRoute && pathname !== '/') {
        const userRole = session.user.app_metadata?.role || 'user'
        return NextResponse.redirect(
            new URL(userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard', request.url)
        )
    }

    // If we don't have a session and trying to access protected routes
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
