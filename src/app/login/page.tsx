'use client'

import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="w-full max-w-[350px] space-y-6">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-bold">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in to your account to continue
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
