import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    const res = NextResponse.next()
    res.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate=59')

    const { pathname } = request.nextUrl

    // Check if the current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith('/auth/')
    )

    // Create middleware client using request/response
    const supabase = createMiddlewareClient({ req: request, res })

    try {
        // 1. Get session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
            return redirectToLogin(request)
        }

        // 2. Handle login page redirects
        if (request.nextUrl.pathname === '/login') {
            if (!session) {
                return res
            }

            // Simple role check - one DB query
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            // Direct routing based on role
            return NextResponse.redirect(
                new URL(
                    `/${data?.role || 'user'}/dashboard`,
                    request.url
                )
            )
        }

        // 3. Handle protected routes
        if (request.nextUrl.pathname.startsWith('/admin') ||
            request.nextUrl.pathname.startsWith('/user')) {
            if (!session) {
                return redirectToLogin(request)
            }

            // Check role access for protected routes
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            const userRole = data?.role || 'user'
            const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

            // Redirect users trying to access admin routes
            if (isAdminRoute && userRole !== 'admin') {
                return NextResponse.redirect(
                    new URL(`/${userRole}/dashboard`, request.url)
                )
            }
        }

        return res
    } catch (error) {
        console.error('Middleware error:', error)
        return redirectToLogin(request)
    }
}

function redirectToLogin(request: NextRequest) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
