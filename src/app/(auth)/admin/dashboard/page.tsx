'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    MessageSquare,
    BarChart3,
    Clock,
    ListTodo,
    Bot,
    AlertCircle,
    Shield,
    UserCog
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
    const stats = [
        {
            title: 'Active Tickets',
            value: '23',
            change: '+5%',
            icon: <ListTodo className="h-4 w-4" />
        },
        {
            title: 'Queue Wait Time',
            value: '4.2m',
            change: '-12%',
            icon: <Clock className="h-4 w-4" />
        },
        {
            title: 'AI Resolution Rate',
            value: '76%',
            change: '+8%',
            icon: <Bot className="h-4 w-4" />
        },
        {
            title: 'Customer Satisfaction',
            value: '4.8/5',
            change: '+2%',
            icon: <Users className="h-4 w-4" />
        }
    ]

    return (
        <main className="p-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Support Dashboard</h2>
                    <p className="text-muted-foreground">
                        Monitor and manage customer support operations
                    </p>
                </div>
                <Button variant="destructive" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    High Priority Queue (5)
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                {stats.map((stat) => (
                    <Card key={stat.title} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-muted-foreground">{stat.icon}</span>
                            <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
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

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* User Management */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">User Management</h3>
                        <Link href="/admin/users">
                            <Button variant="outline" size="sm" className="gap-2">
                                <UserCog className="h-4 w-4" />
                                Manage Users
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Total Users</p>
                                    <p className="text-2xl font-bold">24</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">Active Today</p>
                                <p className="text-2xl font-bold text-primary">18</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-blue-500" />
                                    <p className="text-sm font-medium">Admins</p>
                                </div>
                                <p className="text-xl font-bold">3</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-4 w-4 text-green-500" />
                                    <p className="text-sm font-medium">Support</p>
                                </div>
                                <p className="text-xl font-bold">21</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Queue Management */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Queue</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium">Technical Issue #1234</p>
                                <p className="text-sm text-muted-foreground">Waiting: 5m</p>
                            </div>
                            <Button size="sm">Assign</Button>
                        </div>
                        {/* Add more queue items */}
                    </div>
                </Card>

                {/* Performance Metrics */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Average Response Time</p>
                                <p className="text-2xl font-bold">2.5 minutes</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        {/* Add more metrics */}
                    </div>
                </Card>

                {/* AI Insights */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Performance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Auto-resolved Tickets</p>
                                <p className="text-2xl font-bold">152 today</p>
                            </div>
                            <Bot className="h-8 w-8 text-muted-foreground" />
                        </div>
                        {/* Add more AI stats */}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Ticket #1235 resolved</p>
                                <p className="text-sm text-muted-foreground">2 minutes ago</p>
                            </div>
                        </div>
                        {/* Add more activity items */}
                    </div>
                </Card>
            </div>
        </main>
    )
} 