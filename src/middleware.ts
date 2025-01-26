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

    // Create a response early so we can modify headers
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate=59')

    const { pathname } = request.nextUrl

    // Check if the current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith('/auth/')
    )

    // Create middleware client using request/response
    const supabase = createMiddlewareClient({ req: request, res: response })

    try {
        // Get session with caching
        const { data: { session }, error } = await supabase.auth.getSession()

        // If there's no session and trying to access protected routes
        if (!session && !isPublicRoute) {
            return redirectToLogin(request)
        }

        // If there's no session but we're on a public route, allow it
        if (!session && isPublicRoute) {
            return response
        }

        // If we have a session but trying to access public routes (except home)
        if (session && isPublicRoute && pathname !== '/') {
            // Get user role from profiles with caching
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            const userRole = profile?.role || 'user'
            return redirectToDashboard(request, userRole)
        }

        // Check role-based access for authenticated users
        if (session) {
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
                return redirectToDashboard(request, userRole)
            }
        }

        return response
    } catch (error) {
        console.error('[Middleware] Unexpected error:', error)
        return isPublicRoute ? response : redirectToLogin(request)
    }
}

function redirectToLogin(request: NextRequest) {
    return NextResponse.redirect(new URL('/login', request.url))
}

function redirectToDashboard(request: NextRequest, role: string) {
    let redirectUrl: string
    switch (role) {
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

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
