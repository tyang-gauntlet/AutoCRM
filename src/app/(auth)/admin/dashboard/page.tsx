'use client'

import React, { useEffect } from 'react'
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
    UserCog,
    Star,
    Activity,
} from 'lucide-react'
import Link from 'next/link'
import { useUserStats } from '@/hooks/use-user-stats'
import { useTicketStats } from '@/hooks/use-ticket-stats'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

export default function AdminDashboard() {
    const { user, profile, loading, error } = useAuth()
    const router = useRouter()
    const { stats: userStats, loading: userLoading } = useUserStats()
    const { stats: ticketStats, loading: ticketLoading } = useTicketStats()

    useEffect(() => {
        console.log('[AdminDashboard] Auth state:', {
            user: user?.id,
            userRole: user?.app_metadata?.role,
            profile: profile?.id,
            profileRole: profile?.role,
            loading,
            error
        })

        if (!loading && (!user || (user.app_metadata.role !== 'admin' && profile?.role !== 'admin'))) {
            console.warn('[AdminDashboard] Redirecting non-admin user:', user?.id)
            router.push('/login')
        }
    }, [user, profile, loading, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading dashboard...</span>
            </div>
        )
    }

    if (!user || (user.app_metadata.role !== 'admin' && profile?.role !== 'admin')) {
        return null
    }

    console.log('[AdminDashboard] Rendering dashboard for admin:', user.email)

    const ticketStatsCards = [
        {
            title: 'Active Tickets',
            value: ticketLoading ? '...' : ticketStats.activeTickets.toString(),
            icon: <ListTodo className="h-5 w-5 text-muted-foreground" />
        },
        {
            title: 'Queue Wait Time',
            value: ticketLoading ? '...' : ticketStats.queueWaitTime,
            icon: <Clock className="h-5 w-5 text-muted-foreground" />
        },
        {
            title: 'AI Resolution Rate',
            value: ticketLoading ? '...' : `${ticketStats.aiResolutionRate}%`,
            icon: <Bot className="h-5 w-5 text-muted-foreground" />
        },
        {
            title: 'Customer Satisfaction',
            value: ticketLoading ? '...' : `${ticketStats.customerSatisfaction}/5`,
            icon: <Star className="h-5 w-5 text-yellow-400" />,
            description: ticketLoading ? '...' : `${ticketStats.feedbackCount || 0} reviews in 30 days`
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
                {!ticketLoading && ticketStats.highPriorityCount > 0 && (
                    <Link href="/admin/tickets?priority=high,urgent">
                        <Button
                            variant="destructive"
                            className="gap-2 animate-pulse shadow-lg relative"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Urgent Queue ({ticketStats.highPriorityCount})
                            </div>
                            <span className="absolute -top-2 -right-2 h-3 w-3 bg-red-500 rounded-full" />
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                {ticketStatsCards.map((stat) => (
                    <Card key={stat.title} className="p-4">
                        <div className="flex items-center gap-3">
                            {stat.icon}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                {stat.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                                )}
                            </div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Total Users</p>
                                    <p className="text-2xl font-bold">{userLoading ? '...' : userStats.totalUsers}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Active Today</p>
                                    <p className="text-2xl font-bold text-primary">{userLoading ? '...' : userStats.activeToday}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-blue-500" />
                                    <p className="text-sm font-medium">Admins</p>
                                </div>
                                <p className="text-xl font-bold">{userLoading ? '...' : userStats.adminCount}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-4 w-4 text-green-500" />
                                    <p className="text-sm font-medium">Support</p>
                                </div>
                                <p className="text-xl font-bold">{userLoading ? '...' : userStats.supportCount}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recent Activity</h3>
                        <Link href="/admin/tickets">
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {ticketLoading ? (
                            <p className="text-muted-foreground">Loading...</p>
                        ) : (
                            ticketStats.recentActivity.map((activity) => (
                                <div key={activity.ticketId} className="flex items-start gap-3 p-2.5 bg-muted/50 rounded-lg">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium truncate">
                                                {activity.title}
                                            </p>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Badge
                                                    variant={
                                                        activity.priority === 'high' ? 'destructive' :
                                                            activity.priority === 'medium' ? 'default' :
                                                                'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {activity.priority}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        activity.status === 'resolved' ? 'default' :
                                                            activity.status === 'in_progress' ? 'secondary' :
                                                                'outline'
                                                    }
                                                    className="text-xs whitespace-nowrap"
                                                >
                                                    {activity.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-2 gap-y-1 mt-1">
                                            <span className="truncate">{activity.action}</span>
                                            {activity.assignedTo && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">assigned to {activity.assignedTo}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span className="truncate">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Performance Metrics */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Average Response Time</p>
                                <p className="text-2xl font-bold">{ticketLoading ? '...' : `${ticketStats.averageResponseTime}m`}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                </Card>

                {/* AI Insights */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">AI Performance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Auto-resolved Today</p>
                                <p className="text-2xl font-bold">{ticketLoading ? '...' : ticketStats.autoResolvedToday}</p>
                            </div>
                            <Bot className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                </Card>
            </div>
        </main>
    )
} 