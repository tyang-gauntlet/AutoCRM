'use client'

import * as React from 'react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LoginForm({ redirectTo }: { redirectTo?: string | null }) {
    const { signIn } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (loading) return

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        setLoading(true)
        setError(null)

        try {
            await signIn(email, password)
            // Add a small delay before navigation
            await new Promise(resolve => setTimeout(resolve, 500))
            router.push(redirectTo || '/dashboard')
        } catch (error) {
            console.error('Login error:', error)
            setError('Invalid login credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            data-testid="email"
                            aria-label="Email address"
                            placeholder="name@example.com"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            data-testid="password"
                            aria-label="Password"
                            autoComplete="current-password"
                            disabled={loading}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        data-testid="login-button"
                        aria-label="Sign in to your account"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </div>
            </form>

            {error && (
                <Alert variant="destructive" data-testid="login-error" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline">
                    Sign up
                </Link>
            </div>
        </div>
    )
} 