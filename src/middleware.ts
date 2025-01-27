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
        console.log('🔒 Middleware processing path:', req.nextUrl.pathname)
        const res = NextResponse.next()
        const supabase = createMiddlewareClient<Database>({ req, res })
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()

        console.log('🔑 Session status:', session ? 'authenticated' : 'unauthenticated')

        // Handle session errors
        if (sessionError) {
            console.log('❌ Session error:', sessionError)
            const redirectUrl = new URL('/login', req.url)
            redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // Check if we're on an auth required route
        const isAuthRoute = req.nextUrl.pathname.startsWith('/(auth)') ||
            req.nextUrl.pathname.startsWith('/admin') ||
            req.nextUrl.pathname.startsWith('/reviewer') ||
            req.nextUrl.pathname.startsWith('/user')
        const isLoginPage = req.nextUrl.pathname === '/login'

        console.log('📍 Route type:', { isAuthRoute, isLoginPage })

        if (!session && isAuthRoute) {
            // Redirect unauthenticated users to login
            console.log('🚫 Unauthenticated user accessing protected route')
            const redirectUrl = new URL('/login', req.url)
            redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
            const response = NextResponse.redirect(redirectUrl)
            console.log('➡️ Redirecting to:', response.headers.get('location'))
            return response
        }

        if (session) {
            // Get user's role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            console.log('👤 Profile data:', profile, 'Error:', profileError)

            const userRole = (profile?.role || 'user') as keyof typeof ROLE_DASHBOARDS
            console.log('👑 User role:', userRole)

            // Check role-based access for admin routes
            if ((req.nextUrl.pathname.startsWith('/(auth)/admin') ||
                req.nextUrl.pathname.startsWith('/admin')) &&
                userRole !== 'admin') {
                console.log('🚫 Non-admin accessing admin route')
                const response = NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], req.url))
                console.log('➡️ Redirecting to:', response.headers.get('location'))
                return response
            }

            // Check role-based access for reviewer routes
            if (req.nextUrl.pathname.startsWith('/reviewer') && userRole !== 'reviewer') {
                console.log('🚫 Non-reviewer accessing reviewer route')
                const response = NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], req.url))
                console.log('➡️ Redirecting to:', response.headers.get('location'))
                return response
            }

            // Redirect authenticated users away from login
            if (isLoginPage) {
                console.log('👤 Authenticated user accessing login page')
                const response = NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], req.url))
                console.log('➡️ Redirecting to:', response.headers.get('location'))
                return response
            }
        }

        console.log('✅ Access granted')
        return res
    } catch (error) {
        // Handle any unexpected errors by redirecting to login
        console.error('❌ Middleware error:', error)
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
        const response = NextResponse.redirect(redirectUrl)
        console.log('➡️ Error redirect to:', response.headers.get('location'))
        return response
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
