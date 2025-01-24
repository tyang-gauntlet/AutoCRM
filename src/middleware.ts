import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback', '/']

// Role-based route access
const ROLE_ROUTES = {
    admin: ['/admin'],
    reviewer: ['/reviewer'],
    user: ['/user']
}

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

        // Refresh the session if possible
        const { data: { session }, error } = await supabase.auth.getSession()

        const { pathname } = request.nextUrl

        // Check if the current route is public
        const isPublicRoute = PUBLIC_ROUTES.some(route =>
            pathname === route || pathname.startsWith('/auth/')
        )

        // If there's an auth error but we're on a public route, allow it
        if (error && isPublicRoute) {
            return res
        }

        // If there's an auth error on a protected route, redirect to login
        if (error && !isPublicRoute) {
            console.error('[Middleware] Auth error:', error)
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // If we have a session but trying to access public routes (except home)
        if (session && isPublicRoute && pathname !== '/') {
            // Get user role from profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            const userRole = profile?.role || 'user'
            let redirectUrl: string

            switch (userRole) {
                case 'admin':
                    redirectUrl = '/admin/dashboard'
                    break
                case 'reviewer':
                    redirectUrl = '/reviewer/dashboard'
                    break
                default:
                    redirectUrl = '/user/dashboard'
            }

            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }

        // If we don't have a session and trying to access protected routes
        if (!session && !isPublicRoute) {
            console.log('[Middleware] Redirecting unauthenticated user to login')
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check role-based access
        if (session) {
            // Get user role from profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            const userRole = profile?.role || 'user'
            const allowedPaths = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES]

            // Check if the current path starts with any of the allowed paths
            const hasAccess = allowedPaths.some(path => pathname.startsWith(path))

            if (!hasAccess && !isPublicRoute) {
                console.log(`[Middleware] User with role ${userRole} attempted to access ${pathname}`)
                // Redirect to their appropriate dashboard
                let redirectUrl: string
                switch (userRole) {
                    case 'admin':
                        redirectUrl = '/admin/dashboard'
                        break
                    case 'reviewer':
                        redirectUrl = '/reviewer/dashboard'
                        break
                    default:
                        redirectUrl = '/user/dashboard'
                }
                return NextResponse.redirect(new URL(redirectUrl, request.url))
            }
        }

        return res
    } catch (error) {
        console.error('[Middleware] Unexpected error:', error)
        // Only redirect to login for non-public routes on unexpected errors
        const isPublicRoute = PUBLIC_ROUTES.some(route =>
            request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith('/auth/')
        )
        return isPublicRoute ? NextResponse.next() : NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
