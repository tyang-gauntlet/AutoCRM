import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/']

// Role-based route access
const ROLE_ROUTES = {
    admin: ['/admin'],
    reviewer: ['/reviewer'],
    user: ['/user']
}

export async function middleware(request: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const { pathname } = request.nextUrl

    try {
        const { data: { session } } = await supabase.auth.getSession()
        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route)

        // Handle unauthenticated users
        if (!session) {
            if (!isPublicRoute) {
                return NextResponse.redirect(new URL('/login', request.url))
            }
            return res
        }

        // Get user role once
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        const userRole = profile?.role || 'user'

        // Handle authenticated users on public routes
        if (isPublicRoute) {
            return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
        }

        // Handle role-based access
        const isAllowedRoute = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES]
            .some(route => pathname.startsWith(route))

        if (!isAllowedRoute) {
            return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url))
        }

        return res
    } catch (error) {
        console.error('[Middleware] Error:', error)
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
}
