export const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/auth/callback'
] as const

export const PROTECTED_ROUTES = {
    user: ['/user'],
    admin: ['/admin'],
    reviewer: ['/reviewer']
} as const 