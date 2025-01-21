'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Plus
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const { user, signOut } = useAuth()

    const stats = [
        {
            title: 'Total Customers',
            value: '156',
            change: '+12%',
            icon: <Users className="h-4 w-4" />
        },
        {
            title: 'Active Interactions',
            value: '23',
            change: '+5%',
            icon: <MessageSquare className="h-4 w-4" />
        },
        {
            title: 'Response Rate',
            value: '92%',
            change: '+3%',
            icon: <BarChart3 className="h-4 w-4" />
        }
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b">
                <div className="flex h-16 items-center px-4">
                    <h1 className="text-xl font-bold">AutoCRM</h1>
                    <div className="ml-auto flex items-center space-x-4">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut()}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-8">
                {/* Welcome Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Here's what's happening with your customers today.
                        </p>
                    </div>
                    <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {stats.map((stat) => (
                        <Card key={stat.title} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-muted-foreground">{stat.icon}</span>
                                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/customers">
                        <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
                            <Users className="h-6 w-6 mb-4" />
                            <h4 className="font-semibold mb-1">Customers</h4>
                            <p className="text-sm text-muted-foreground">Manage your customer base</p>
                        </Card>
                    </Link>
                    <Link href="/interactions">
                        <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
                            <MessageSquare className="h-6 w-6 mb-4" />
                            <h4 className="font-semibold mb-1">Interactions</h4>
                            <p className="text-sm text-muted-foreground">View recent interactions</p>
                        </Card>
                    </Link>
                    <Link href="/analytics">
                        <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
                            <BarChart3 className="h-6 w-6 mb-4" />
                            <h4 className="font-semibold mb-1">Analytics</h4>
                            <p className="text-sm text-muted-foreground">Track performance metrics</p>
                        </Card>
                    </Link>
                    <Link href="/settings">
                        <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
                            <Settings className="h-6 w-6 mb-4" />
                            <h4 className="font-semibold mb-1">Settings</h4>
                            <p className="text-sm text-muted-foreground">Configure your workspace</p>
                        </Card>
                    </Link>
                </div>
            </main>
        </div>
    )
} 