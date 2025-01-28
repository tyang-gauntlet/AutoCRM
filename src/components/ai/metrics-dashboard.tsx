import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAIMetrics } from '@/hooks/use-ai-metrics'
import { Brain, MessageSquare, TrendingUp } from 'lucide-react'
import { MetricsDisplay } from './metrics-display'

export function MetricsDashboard() {
    const stats = useTicketStats()

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <h3 className="font-semibold">AI Resolution Rate</h3>
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold">
                            {stats.aiResolutionRate}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {stats.autoResolvedToday} tickets auto-resolved today
                        </p>
                    </div>
                </Card>

                {/* Add more stat cards */}
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">AI Performance Trends</h3>
                {/* Add trend charts */}
            </Card>
        </div>
    )
} 