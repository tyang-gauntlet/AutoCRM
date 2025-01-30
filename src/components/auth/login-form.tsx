'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
    const { toast } = useToast()
    const { signIn, signUp } = useAuth()

    // Login state
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    })

    // Signup state
    const [signupData, setSignupData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
    })

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await signIn(loginData.email, loginData.password)
            // Auth context will handle the redirect
        } catch (error) {
            console.error('Login error:', error)
            toast({
                variant: 'destructive',
                title: 'Login failed',
                description: error instanceof Error ? error.message : 'Failed to login'
            })
            setIsLoading(false)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (signupData.password !== signupData.confirmPassword) {
                throw new Error('Passwords do not match')
            }

            await signUp(signupData.email, signupData.password)
            // Sign in immediately after signup
            await signIn(signupData.email, signupData.password)
            // Auth context will handle the redirect to dashboard
            toast({
                title: 'Success',
                description: 'Account created successfully'
            })
            setActiveTab('login')
        } catch (error) {
            console.error('Signup error:', error)
            toast({
                variant: 'destructive',
                title: 'Signup failed',
                description: error instanceof Error ? error.message : 'Failed to sign up'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-[400px]">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="signup" className="p-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Full Name"
                            value={signupData.fullName}
                            onChange={(e) => setSignupData(prev => ({ ...prev, fullName: e.target.value }))}
                            required
                        />
                        <Input
                            type="email"
                            placeholder="Email"
                            value={signupData.email}
                            onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Confirm Password"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing up...' : 'Sign Up'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>

            {/* Test Login Buttons */}
            <div className="p-6 border-t">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center font-medium">Test Accounts</p>
                    <div className="grid gap-2">
                        <Button
                            variant="outline"
                            onClick={() => signIn('admin@example.com', 'admin123')}
                            disabled={isLoading}
                        >
                            Login as Admin
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => signIn('reviewer@example.com', 'reviewer123')}
                            disabled={isLoading}
                        >
                            Login as Reviewer
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => signIn('user@example.com', 'user123')}
                            disabled={isLoading}
                        >
                            Login as User
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
} 