'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Search,
    BookOpen,
    Video,
    Clock,
    Bot,
    ArrowRight,
    HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import { useTickets } from '@/hooks/use-tickets'
import { Badge } from '@/components/ui/badge'

const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
} as const

export default function UserDashboard() {
    const { tickets, loading } = useTickets()
    const recentTickets = tickets.slice(0, 3) // Show only 3 most recent tickets

    return (
        <main className="p-8">
            {/* Welcome Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Welcome to Support</h2>
                <p className="text-muted-foreground">
                    Get help or explore our knowledge base
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card className="p-6">
                    <Bot className="h-8 w-8 mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Get instant answers to common questions
                    </p>
                    <Button className="w-full">Start Chat</Button>
                </Card>

                <Card className="p-6">
                    <MessageSquare className="h-8 w-8 mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Human Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create a ticket for complex issues
                    </p>
                    <Button className="w-full" asChild>
                        <Link href="/user/tickets/new">New Ticket</Link>
                    </Button>
                </Card>

                <Card className="p-6">
                    <Search className="h-8 w-8 mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Search Help</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Browse our knowledge base
                    </p>
                    <Button className="w-full">Search</Button>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Active Tickets */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Your Tickets</h3>
                        <Button variant="ghost" className="gap-2" asChild>
                            <Link href="/user/tickets">
                                View All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading tickets...</p>
                        ) : recentTickets.length > 0 ? (
                            recentTickets.map((ticket) => (
                                <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{ticket.title}</p>
                                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Updated {new Date(ticket.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/user/tickets/${ticket.id}`}>View</Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No tickets found</p>
                        )}
                    </div>
                </Card>

                {/* Popular Resources */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Popular Resources</h3>
                    <div className="space-y-4">
                        <Link href="/kb/getting-started" className="block">
                            <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Getting Started Guide</p>
                                    <p className="text-sm text-muted-foreground">Basic setup and configuration</p>
                                </div>
                            </div>
                        </Link>
                        <Link href="/kb/tutorials" className="block">
                            <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                                <Video className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Video Tutorials</p>
                                    <p className="text-sm text-muted-foreground">Step-by-step visual guides</p>
                                </div>
                            </div>
                        </Link>
                        {/* Add more resources */}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Viewed Getting Started Guide</p>
                                <p className="text-sm text-muted-foreground">2 hours ago</p>
                            </div>
                        </div>
                        {/* Add more activity items */}
                    </div>
                </Card>

                {/* FAQ Section */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        <Link href="/faq/account" className="block">
                            <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">How do I reset my password?</p>
                                    <p className="text-sm text-muted-foreground">Account management guide</p>
                                </div>
                            </div>
                        </Link>
                        {/* Add more FAQs */}
                    </div>
                </Card>
            </div>
        </main>
    )
} 