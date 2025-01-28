import { TicketDetails } from '@/components/tickets/ticket-details'
import { MetricsDisplay } from '@/components/ai/metrics-display'
import { Separator } from '@/components/ui/separator'

interface TicketPageProps {
    params: {
        id: string
    }
}

export default function TicketPage({ params }: TicketPageProps) {
    return (
        <div className="container py-6 space-y-6">
            <TicketDetails ticketId={params.id} />
            <Separator />
            <div>
                <h2 className="text-lg font-semibold mb-4">AI Performance Metrics</h2>
                <MetricsDisplay ticketId={params.id} />
            </div>
        </div>
    )
} 