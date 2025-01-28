import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    console.log('🟢 Middleware: Processing request for', request.nextUrl.pathname)

    const {
        data: { session },
    } = await supabase.auth.getSession()

    console.log('🟢 Middleware: Session exists:', !!session)

    // Check if this is a public route
    const isPublicRoute = ['/login', '/signup', '/'].includes(request.nextUrl.pathname)
    console.log('🟢 Middleware: Public route detected:', isPublicRoute)

    if (session) {
        // Get the user's profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        const role = profile?.role || session.user.app_metadata.role
        console.log('🟢 Middleware: User role:', role)

        // If user is logged in and tries to access public routes
        if (isPublicRoute) {
            console.log('🟢 Middleware: Redirecting authenticated user to dashboard')
            // Redirect based on role
            let dashboardPath = '/user/dashboard'
            if (role === 'admin') {
                dashboardPath = '/admin/dashboard'
            } else if (role === 'reviewer') {
                dashboardPath = '/reviewer/dashboard'
            }
            return NextResponse.redirect(new URL(dashboardPath, request.url))
        }

        // Handle role-based access
        if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
            console.log('🔴 Middleware: Non-admin attempting to access admin route')
            return NextResponse.redirect(new URL('/user/dashboard', request.url))
        }

        if (request.nextUrl.pathname.startsWith('/reviewer') && role !== 'reviewer') {
            console.log('🔴 Middleware: Non-reviewer attempting to access reviewer route')
            return NextResponse.redirect(new URL('/user/dashboard', request.url))
        }
    } else if (!isPublicRoute) {
        // If user is not logged in and tries to access protected routes
        console.log('🟢 Middleware: Redirecting unauthenticated user to login')
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
