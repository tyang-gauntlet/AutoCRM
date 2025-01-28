'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Settings } from 'lucide-react'
import { useRole } from '@/hooks/use-role'

export function KBHeader() {
    const { role } = useRole()
    const isAdmin = role === 'admin'

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            role="banner"
        >
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link
                        href="/"
                        className="mr-6 flex items-center space-x-2"
                        aria-label="Go to homepage"
                    >
                        <span className="font-bold">AutoCRM</span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    {isAdmin && (
                        <Button variant="ghost" asChild className="gap-2">
                            <Link href="/admin/kb">
                                <Settings className="h-4 w-4" />
                                Manage KB
                            </Link>
                        </Button>
                    )}
                    <Button variant="ghost" asChild className="gap-2">
                        <Link href="/user/dashboard">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    )
} 