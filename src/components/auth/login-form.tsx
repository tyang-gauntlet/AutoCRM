'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
    const router = useRouter()
    const supabase = createClientComponentClient()

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
            const { error: signInError, data: { user } } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
            })

            if (signInError) throw signInError

            // Get user's role from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user?.id)
                .single()

            toast.success('Successfully logged in')

            // Determine redirect path based on role
            let redirectPath = '/user/dashboard'
            if (profile?.role === 'admin') {
                redirectPath = '/admin/dashboard'
            } else if (profile?.role === 'reviewer') {
                redirectPath = '/reviewer/dashboard'
            }

            router.push(redirectPath)
        } catch (error) {
            console.error('Login error:', error)
            if (error instanceof Error) {
                toast.error(error instanceof Error ? error.message : 'Failed to login')
            } else {
                toast.error('Failed to login')
            }
        } finally {
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

            const { error: signUpError } = await supabase.auth.signUp({
                email: signupData.email,
                password: signupData.password,
                options: {
                    data: {
                        full_name: signupData.fullName,
                    },
                },
            })

            if (signUpError) throw signUpError

            toast.success('Check your email to confirm your account')
            setActiveTab('login')
        } catch (error) {
            console.error('Signup error:', error)
            if (error instanceof Error) {
                toast.error(error.message || 'Failed to sign up')
            } else {
                toast.error('Failed to sign up')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-[400px]">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                    Choose your preferred sign in method
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    disabled={isLoading}
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-fullname">Full Name</Label>
                                <Input
                                    id="signup-fullname"
                                    placeholder="John Doe"
                                    type="text"
                                    disabled={isLoading}
                                    value={signupData.fullName}
                                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input
                                    id="signup-email"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    value={signupData.email}
                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    disabled={isLoading}
                                    value={signupData.password}
                                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                                <Input
                                    id="signup-confirm-password"
                                    type="password"
                                    disabled={isLoading}
                                    value={signupData.confirmPassword}
                                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Account
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter>
                <div className="text-sm text-muted-foreground text-center w-full">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-primary">
                        Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline hover:text-primary">
                        Privacy Policy
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
} 