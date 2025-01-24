'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        console.log('[Login] Starting login process for:', email)
        setError(null)
        setIsSubmitting(true)

        try {
            // Check if there's any existing session first
            const { data: { session: existingSession } } = await supabase.auth.getSession()
            if (existingSession) {
                console.log('[Login] Found existing session, signing out first')
                await supabase.auth.signOut()
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            console.log('[Login] Attempting sign in')
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.error('[Login] Sign in error:', error)
                throw error
            }

            console.log('[Login] Sign in successful, session present?', !!data.session)
            if (data?.session) {
                // Verify the session was stored
                const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
                if (verifyError) {
                    console.error('[Login] Error verifying session:', verifyError)
                }
                console.log('[Login] Verified session present?', !!verifySession)

                // Get user role from profiles
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .single()

                const role = profile?.role || 'user'
                console.log('[Login] User role:', role)

                // Add a small delay to ensure session is properly set
                await new Promise(resolve => setTimeout(resolve, 1000))

                // Refresh the router to trigger middleware check
                router.refresh()

                // Redirect based on role using window.location for a hard redirect
                let redirectPath: string
                switch (role) {
                    case 'admin':
                        redirectPath = '/admin/dashboard'
                        break
                    case 'reviewer':
                        redirectPath = '/reviewer/dashboard'
                        break
                    default:
                        redirectPath = '/user/dashboard'
                }
                console.log('[Login] Redirecting to:', redirectPath)
                window.location.href = redirectPath
            } else {
                console.error('[Login] No session after successful sign in')
                setError('Authentication failed - no session created')
            }
        } catch (error: any) {
            console.error('[Login] Login process error:', error)
            setError(error?.message || 'Invalid email or password')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-md space-y-8 px-4 py-8">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground">
                        Sign in to your account to continue
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <a href="/signup" className="underline">
                        Sign up
                    </a>
                </div>
            </div>
        </div>
    )
}
