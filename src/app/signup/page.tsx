'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SignUpPage() {
    const { signUp } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await signUp(email, password)
            setError('Check your email for the confirmation link')
        } catch (error) {
            setError('Error creating account')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                            {error}
                        </div>
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

                    <div>
                        <Button type="submit" className="w-full">
                            Sign up
                        </Button>
                    </div>
                </form>

                <div className="text-center text-sm">
                    <Link href="/login" className="text-primary hover:text-primary/90">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}
