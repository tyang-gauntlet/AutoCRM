import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

    try {
        const accessToken = req.cookies.get('sb-access-token')?.value

        console.log('[Middleware] Token:', {
            hasAccess: !!accessToken,
            path: req.nextUrl.pathname
        })

        // Get session from access token
        let session = null
        if (accessToken) {
            try {
                // Create client with auth header
                const supabase = createServerClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    {
                        auth: {
                            persistSession: false,
                            autoRefreshToken: false,
                            detectSessionInUrl: false
                        },
                        global: {
                            headers: {
                                Authorization: `Bearer ${accessToken}`
                            }
                        },
                        cookies: {
                            get(name: string) {
                                return req.cookies.get(name)?.value
                            },
                            set(name: string, value: string, options: any) {
                                res.cookies.set({
                                    name,
                                    value,
                                    ...options,
                                    path: '/'
                                })
                            },
                            remove(name: string, options: any) {
                                res.cookies.delete({
                                    name,
                                    ...options,
                                    path: '/'
                                })
                            },
                        }
                    }
                )

                // Try to get user with token
                const { data: { user }, error } = await supabase.auth.getUser(accessToken)

                console.log('[Middleware] Auth check:', {
                    hasUser: !!user,
                    userId: user?.id,
                    userRole: user?.app_metadata?.role,
                    error: error?.message
                })

                if (!error && user) {
                    session = {
                        access_token: accessToken,
                        user,
                        expires_at: Math.floor(Date.now() / 1000) + 3600
                    }
                    console.log('[Middleware] Auth valid:', {
                        userId: user.id,
                        role: user.app_metadata.role
                    })
                }
            } catch (error) {
                console.warn('[Middleware] Auth error:', error)
            }
        }

        const path = req.nextUrl.pathname
        const isPublicRoute = publicRoutes.has(path) ||
            Array.from(publicRoutes).some(route => path.startsWith(route))

        console.log('[Middleware] Auth state:', {
            path,
            hasSession: !!session,
            userId: session?.user?.id,
            role: session?.user?.app_metadata?.role,
            isPublicRoute
        })

        // Redirect to login if no session on protected route
        if (!session && !isPublicRoute) {
            console.log('[Middleware] No valid session, redirecting to login')
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // If has session and on login page
        if (session && path === '/login') {
            const userRole = session.user.app_metadata.role || 'user'
            const dashboardPaths = {
                admin: '/admin/dashboard',
                reviewer: '/reviewer/dashboard',
                user: '/user/dashboard'
            } as const

            const redirectTo = dashboardPaths[userRole as UserRole] || '/user/dashboard'
            console.log('[Middleware] Redirecting to:', redirectTo)
            return NextResponse.redirect(new URL(redirectTo, req.url))
        }

        // Role-based route protection
        const roleBasedPaths = {
            admin: '/admin',
            reviewer: '/reviewer',
            user: '/user'
        }

        // Check if user has access to this path
        if (session) {
            const userRole = session.user.app_metadata.role || 'user'
            const allowedPath = roleBasedPaths[userRole as UserRole]

            // If trying to access a role-based path
            for (const [role, path] of Object.entries(roleBasedPaths)) {
                if (req.nextUrl.pathname.startsWith(path) && role !== userRole) {
                    console.log('[Middleware] Invalid role access:', {
                        userRole,
                        attemptedPath: req.nextUrl.pathname
                    })
                    // Redirect to their proper dashboard
                    return NextResponse.redirect(new URL(dashboardPaths[userRole as UserRole], req.url))
                }
            }
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
        return NextResponse.redirect(new URL('/login', req.url))
    }
}
