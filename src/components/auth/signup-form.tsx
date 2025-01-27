'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

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
        <>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} data-testid="signup-form">
                {error && (
                    <Alert variant="destructive" data-testid="signup-error">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4 rounded-md">
                    <div>
                        <label htmlFor="email" className="sr-only">
                            Email address
                        </label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                    data-testid="signup-submit"
                >
                    {loading ? 'Signing up...' : 'Sign up'}
                </Button>
            </form>

            <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:text-primary/90">
                    Already have an account? Sign in
                </Link>
            </div>
        </>
    )
} 