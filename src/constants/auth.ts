export const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/'] as const

export const ROLE_ROUTES = {
    admin: ['/admin'],
    reviewer: ['/reviewer'],
    user: ['/user']
} as const

export const ROLE_REDIRECTS = {
    admin: '/admin/dashboard',
    reviewer: '/reviewer/dashboard',
    user: '/user/dashboard'
} as const

export type UserRole = keyof typeof ROLE_ROUTES 