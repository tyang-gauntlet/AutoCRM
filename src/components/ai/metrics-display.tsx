'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Bot, Brain, MessageSquare } from 'lucide-react'
import { useAIMetrics } from '@/hooks/use-ai-metrics'

interface MetricsDisplayProps {
    ticketId: string
}

export function MetricsDisplay({ ticketId }: MetricsDisplayProps) {
    const {
        loading,
        error,
        kraMetrics,
        rgqsMetrics
    } = useAIMetrics(ticketId)

    if (loading) {
        return (
            <Card className="p-4">
                <div data-testid="metrics-loading" className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-8 bg-muted rounded" />
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-4">
                <p className="text-destructive">Error loading metrics: {error}</p>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4" />
                    <h3 className="font-semibold">Knowledge Retrieval Accuracy</h3>
                </div>
                {kraMetrics ? (
                    <>
                        <Progress
                            value={kraMetrics.avg_score * 100}
                            className="h-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>{Math.round(kraMetrics.avg_score * 100)}%</span>
                            <span>{kraMetrics.count} measurements</span>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                )}
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-semibold">Response Quality Score</h3>
                </div>
                {rgqsMetrics ? (
                    <>
                        <Progress
                            value={rgqsMetrics.avg_score * 100}
                            className="h-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>{Math.round(rgqsMetrics.avg_score * 100)}%</span>
                            <span>{rgqsMetrics.count} measurements</span>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No data available</p>
                )}
            </Card>
        </div>
    )
} 