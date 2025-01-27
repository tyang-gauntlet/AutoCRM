'use client'

import { SignupForm } from '@/components/auth/signup-form'

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight">
                        Create your account
                    </h2>
                </div>
                <SignupForm />
            </div>
        </div>
    )
}
