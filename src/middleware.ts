import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback', '/']

// Role-based route access
const ROLE_ROUTES = {
    admin: ['/admin'],
    reviewer: ['/reviewer'],
    user: ['/user']
}

// Add role-specific dashboard paths
const ROLE_DASHBOARDS = {
    admin: '/admin/dashboard',
    reviewer: '/reviewer/dashboard',
    user: '/user/dashboard'
} as const

export async function middleware(req: NextRequest) {
    try {
        const res = NextResponse.next()
        const supabase = createMiddlewareClient<Database>({ req, res })
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
            const redirectUrl = new URL('/login', req.url)
            return NextResponse.redirect(redirectUrl)
        }

        // Check if we're on an auth required route
        const isAuthRoute = req.nextUrl.pathname.startsWith('/(auth)') ||
            req.nextUrl.pathname.startsWith('/admin') ||
            req.nextUrl.pathname.startsWith('/reviewer') ||
            req.nextUrl.pathname.startsWith('/user')
        const isLoginPage = req.nextUrl.pathname === '/login'

        if (!session && isAuthRoute) {
            const redirectUrl = new URL('/login', req.url)
            return NextResponse.redirect(redirectUrl)
        }

        if (session) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            const userRole = (profile?.role || 'user') as keyof typeof ROLE_DASHBOARDS

            // Redirect from login or generic dashboard to role-specific dashboard
            if (isLoginPage || req.nextUrl.pathname === '/dashboard') {
                return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], req.url))
            }

            // Role-based route protection
            if (req.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
                return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], req.url))
            }

            if (req.nextUrl.pathname.startsWith('/reviewer') && userRole !== 'reviewer') {
                return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], req.url))
            }
        }

        return res
    } catch (error) {
        console.error('Middleware error:', error)
        const redirectUrl = new URL('/login', req.url)
        return NextResponse.redirect(redirectUrl)
    }
}

// Specify which routes should trigger this middleware
export const config = {
    matcher: [
        '/(auth)/:path*',
        '/admin/:path*',
        '/reviewer/:path*',
        '/user/:path*',
        '/login',
    ],
}
