'use client'

import React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { useFeedback } from '@/hooks/use-feedback'
import { Card, CardContent } from '@/components/ui/card'
import { StarIcon } from 'lucide-react'

export default function FeedbackPage() {
    const { feedback, isLoading, error, stats } = useFeedback()

    if (error) {
        return <div>Error: {error}</div>
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold">Ticket Feedback</h1>
                <div className="flex gap-4">
                    <Card className="w-[140px]">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                                <StarIcon className="h-4 w-4 text-yellow-400" />
                                <p className="text-sm font-medium">Rating</p>
                            </div>
                            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
                        </CardContent>
                    </Card>
                    <Card className="w-[140px]">
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium">Total</p>
                            <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                        </CardContent>
                    </Card>
                    <Card className="w-[140px]">
                        <CardContent className="pt-6">
                            <p className="text-sm font-medium">Last 7d</p>
                            <p className="text-2xl font-bold">{stats.recentFeedback}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DataTable columns={columns} data={feedback || []} />
        </div>
    )
}
