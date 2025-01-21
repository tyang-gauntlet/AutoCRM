'use client'

import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
    const { user, signOut } = useAuth()

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4">Welcome, {user?.email}</p>
            <button
                onClick={signOut}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Sign Out
            </button>
        </div>
    )
}
