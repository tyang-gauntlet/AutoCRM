import { useAIMetrics } from '@/hooks/use-ai-metrics'
import { useChat } from '@/hooks/use-chat'
import { nanoid } from 'nanoid'
import { toast } from '@/components/ui/use-toast'

export function AIChat({ ticketId }: { ticketId: string }) {
    const { messages, sendMessage, isLoading } = useChat()
    const { recordMetrics } = useAIMetrics(ticketId)

    const handleSend = async (message: string) => {
        try {
            const traceId = `trace_${nanoid()}`
            const response = await sendMessage(message, { traceId })

            // Record KRA metrics
            await recordMetrics('kra', traceId, {
                query_text: message,
                retrieved_chunks: response.context.chunks,
                relevant_chunks: response.context.relevant,
                accuracy: response.context.accuracy,
                relevance_score: response.context.relevance,
                context_match: response.context.contextMatch
            })

            // Record RGQS metrics
            await recordMetrics('rgqs', traceId, {
                response_text: response.content,
                overall_quality: response.quality.overall,
                relevance: response.quality.relevance,
                accuracy: response.quality.accuracy,
                tone: response.quality.tone
            })

        } catch (error) {
            console.error('Error sending message:', error)
            // Show error toast
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive"
            })
        }
    }

    // ... rest of component
} 