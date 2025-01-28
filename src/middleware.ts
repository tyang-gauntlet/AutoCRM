import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Export the config first
export const config = {
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

// Define public routes that don't require authentication
const publicRoutes = new Set([
    '/login',
    '/signup',
    '/forgot-password',
    '/kb',
    '/api/health'
])

type UserRole = 'admin' | 'reviewer' | 'user'

// Then export the middleware function
export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    res.cookies.set({
                        name,
                        value,
                        ...options,
                        path: '/',
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                        httpOnly: true
                    })
                },
                remove(name: string, options: any) {
                    res.cookies.delete({
                        name,
                        ...options,
                        path: '/'
                    })
                },
            },
        }
    )

    try {
        // Get both tokens
        const accessToken = req.cookies.get('sb-access-token')?.value
        const refreshToken = req.cookies.get('sb-refresh-token')?.value

        // Debug tokens
        console.log('[Middleware] Tokens:', {
            hasAccess: !!accessToken,
            hasRefresh: !!refreshToken,
            path: req.nextUrl.pathname
        })

        // Try to get or refresh session
        let session = null
        if (accessToken) {
            const { data, error } = await supabase.auth.getSession()
            if (!error) {
                session = data.session
            }
        }

        // If no session but we have tokens, try to refresh
        if (!session && refreshToken) {
            const { data, error } = await supabase.auth.refreshSession({
                refresh_token: refreshToken
            })
            if (!error) {
                session = data.session
            }
        }

        const path = req.nextUrl.pathname
        const isPublicRoute = publicRoutes.has(path) ||
            Array.from(publicRoutes).some(route => path.startsWith(route))

        // Debug session state
        console.log('[Middleware] Auth state:', {
            path,
            hasSession: !!session,
            userId: session?.user?.id,
            role: session?.user?.app_metadata?.role,
            isPublicRoute
        })

        // If no session and trying to access protected route
        if (!session && !isPublicRoute) {
            const redirectUrl = new URL('/login', req.url)
            redirectUrl.searchParams.set('from', path)
            return NextResponse.redirect(redirectUrl)
        }

        // If has session and on login page
        if (session && path === '/login') {
            const userRole = session.user.app_metadata.role || 'user'
            const from = req.nextUrl.searchParams.get('from')

            const dashboardPaths = {
                admin: '/admin/dashboard',
                reviewer: '/reviewer/dashboard',
                user: '/user/dashboard'
            } as const

            // Determine redirect path
            const redirectTo = from || dashboardPaths[userRole as UserRole] || '/user/dashboard'

            console.log('[Middleware] Redirecting to:', redirectTo)
            return NextResponse.redirect(new URL(redirectTo, req.url))
        }

        // Add auth headers
        res.headers.set('x-auth-state', session ? 'authenticated' : 'unauthenticated')
        if (session?.user) {
            res.headers.set('x-user-id', session.user.id)
            res.headers.set('x-user-role', session.user.app_metadata.role || 'user')
        }

        return res
    } catch (error) {
        console.error('[Middleware] Error:', error)
        const redirectUrl = new URL('/login', req.url)
        if (!publicRoutes.has(req.nextUrl.pathname)) {
            redirectUrl.searchParams.set('from', req.nextUrl.pathname)
        }
        return NextResponse.redirect(redirectUrl)
    }
}
