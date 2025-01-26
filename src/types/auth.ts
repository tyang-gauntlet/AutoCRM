import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'reviewer' | 'user'

export interface AuthState {
    user: User | null
    loading: boolean
    error: string | null
}

export interface AuthActions {
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    signUp: (email: string, password: string) => Promise<{
        data: { user: User | null; session: Session | null } | null;
        error: Error | null;
    }>
} 