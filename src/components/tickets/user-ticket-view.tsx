'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons"
import type { TicketWithDetails, TicketMessage } from '@/types/tickets'
import { TicketDetail } from './ticket-detail'

interface UserTicketViewProps {
    ticket: TicketWithDetails
    messages: TicketMessage[]
    sendMessage: (message: string) => Promise<boolean>
    onSubmitFeedback?: (feedback: { rating: number; comment: string }) => Promise<void>
}

export function UserTicketView({
    ticket,
    messages,
    sendMessage,
    onSubmitFeedback
}: UserTicketViewProps) {
    const [rating, setRating] = React.useState(0)
    const [comment, setComment] = React.useState('')
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const handleSubmitFeedback = async () => {
        if (onSubmitFeedback) {
            await onSubmitFeedback({ rating, comment })
            setIsDialogOpen(false)
            // Reset form
            setRating(0)
            setComment('')
        }
    }

    return (
        <div className="relative">
            <TicketDetail
                ticket={ticket}
                messages={messages}
                sendMessage={sendMessage}
            />

            {/* Feedback Button for Closed Tickets */}
            {ticket.status === 'closed' && (
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
                    <div className="container mx-auto p-4 flex justify-end">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Provide Feedback</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Ticket Feedback</DialogTitle>
                                    <DialogDescription>
                                        Please rate your experience and provide any additional feedback.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="flex items-center justify-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="p-1 hover:scale-110 transition-transform"
                                                onClick={() => setRating(star)}
                                            >
                                                {star <= rating ? (
                                                    <StarFilledIcon className="h-8 w-8 text-yellow-400" />
                                                ) : (
                                                    <StarIcon className="h-8 w-8 text-muted-foreground" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <Textarea
                                        placeholder="Share your experience with this ticket resolution..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={handleSubmitFeedback}>
                                        Submit Feedback
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}
        </div>
    )
} 