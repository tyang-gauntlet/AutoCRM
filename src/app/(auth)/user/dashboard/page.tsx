'use client'

import React, { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Search,
    Bot,
    ArrowRight,
    HelpCircle,
    Clock,
    FileText,
    BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { useTickets } from '@/hooks/use-tickets'
import { useUserActivity } from '@/hooks/use-user-activity'
import { Badge } from '@/components/ui/badge'
import { priorityColors } from '@/constants/ticket'
import { formatDistanceToNow } from 'date-fns'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

export default function UserDashboard() {
    const { tickets, loading: ticketsLoading } = useTickets()
    const { activities, faqs, loading: activityLoading } = useUserActivity()
    const recentTickets = tickets.slice(0, 3) // Show only 3 most recent tickets
    const { user, profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader size="lg" />
            </div>
        )
    }

    if (!user || !profile) {
        return null
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'ticket':
                return <MessageSquare className="h-5 w-5 text-blue-500" />
            case 'kb':
                return <BookOpen className="h-5 w-5 text-green-500" />
            default:
                return <Clock className="h-5 w-5 text-muted-foreground" />
        }
    }

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
                    <Button className="w-full" asChild>
                        <Link href="/user/chat">Start Chat</Link>
                    </Button>
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
                    <Button className="w-full" asChild>
                        <Link href="/kb">Search</Link>
                    </Button>
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
                        {ticketsLoading ? (
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

                {/* Recent Activity */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recent Activity</h3>
                    </div>
                    <div className="space-y-4">
                        {activityLoading ? (
                            <p className="text-sm text-muted-foreground">Loading activity...</p>
                        ) : activities.length > 0 ? (
                            activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    {getActivityIcon(activity.type)}
                                    <div>
                                        <p className="font-medium">{activity.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No recent activity</p>
                        )}
                    </div>
                </Card>

                {/* FAQ Section */}
                <Card className="p-6 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
                        <Button variant="ghost" className="gap-2" asChild>
                            <Link href="/kb">
                                Browse All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {activityLoading ? (
                            <p className="text-sm text-muted-foreground">Loading FAQs...</p>
                        ) : faqs.length > 0 ? (
                            faqs.map((faq) => (
                                <Card key={faq.id} className="p-6">
                                    <Link
                                        href={`/kb/articles/${faq.slug}`}
                                        className="block hover:no-underline"
                                    >
                                        <h3 className="text-xl font-semibold mb-2 text-primary hover:text-primary/80">
                                            <BookOpen className="inline-block h-5 w-5 mr-2" />
                                            {faq.title}
                                        </h3>
                                        <div
                                            className={cn(
                                                "text-sm text-muted-foreground",
                                                "prose dark:prose-invert max-w-none",
                                                "[&>*:first-child]:mt-0",
                                                "[&>*:last-child]:mb-0",
                                                // Headings
                                                "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2",
                                                "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2",
                                                "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
                                                // Paragraphs and spacing
                                                "[&_p]:my-2 [&_p]:leading-6",
                                                // Lists
                                                "[&_ul]:!list-disc [&_ul]:!pl-6 [&_ul]:my-2",
                                                "[&_ol]:!list-decimal [&_ol]:!pl-6 [&_ol]:my-2",
                                                "[&_li]:my-0.5",
                                                // Links
                                                "[&_a]:text-primary [&_a]:underline [&_a]:font-medium",
                                                // Strong and emphasis
                                                "[&_strong]:font-bold [&_em]:italic"
                                            )}
                                            dangerouslySetInnerHTML={{ __html: faq.preview_html || '' }}
                                        />
                                    </Link>
                                </Card>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No FAQs found</p>
                        )}
                    </div>
                </Card>
            </div>
        </main>
    )
} 