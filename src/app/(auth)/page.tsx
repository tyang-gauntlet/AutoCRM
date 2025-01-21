'use client'

import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

export default function Home() {
    const { user } = useAuth()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Welcome to AutoCRM</h1>
            <p className="mt-4">You are logged in as {user.email}</p>
        </div>
    )
} 