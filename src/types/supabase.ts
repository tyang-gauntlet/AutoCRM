export type UserRole = 'admin' | 'reviewer' | 'user'

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    role: UserRole
                    status: string
                    email: string
                    last_sign_in_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    role?: UserRole
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    role?: UserRole
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            // ... other tables ...
        }
        Views: {
            user_emails: {
                Row: {
                    id: string
                    full_name: string | null
                    role: 'admin' | 'reviewer' | 'user'
                    status: string
                    created_at: string
                    updated_at: string
                    email: string
                    last_sign_in_at: string | null
                }
            }
        }
    }
} 