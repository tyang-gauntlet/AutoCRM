'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Auth layout error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                <h2 className="mt-4 text-lg font-semibold">Something went wrong!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {error.message || 'An unexpected error occurred'}
                </p>
                <Button
                    onClick={reset}
                    className="mt-4"
                    variant="outline"
                >
                    Try again
                </Button>
            </div>
        </div>
    )
} 