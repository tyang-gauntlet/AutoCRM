'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    React.useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">Something went wrong!</h2>
            <Button onClick={reset}>Try again</Button>
        </div>
    )
} 