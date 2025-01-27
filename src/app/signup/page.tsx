'use client'

import { SignUpForm } from '@/components/auth/signup-form'

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <div className="w-full max-w-[350px] space-y-6">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-bold">
                        Create an account
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email below to create your account
                    </p>
                </div>
                <SignUpForm />
            </div>
        </div>
    )
}
