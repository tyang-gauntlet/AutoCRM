import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
    // Get the token from cookie
    const token = request.cookies.get('sb-access-token')?.value

    // If there's no token and the route isn't public, redirect to login
    if (!token && !PUBLIC_ROUTES.includes(request.nextUrl.pathname)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    ],
}
