'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function SignupForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const { signUp, loading } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            const { error: signUpError } = await signUp(email, password)
            if (signUpError) throw signUpError
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating account')
        }
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            data-testid="signup-email"
                            aria-label="Email address"
                            placeholder="name@example.com"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={loading}
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            data-testid="signup-password"
                            aria-label="Password"
                            autoComplete="new-password"
                            disabled={loading}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        data-testid="signup-submit"
                        aria-label="Create account"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing up...
                            </>
                        ) : (
                            'Sign up'
                        )}
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive" data-testid="signup-error" role="alert">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </form>

            <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:text-primary/90">
                    Already have an account? Sign in
                </Link>
            </div>
        </div>
    )
} 