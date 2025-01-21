'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export default function NewTicket() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClientComponentClient<Database>()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('Not authenticated')
            }

            const { error } = await supabase
                .from('tickets')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    created_by: session.user.id,
                    status: 'open'
                })

            if (error) throw error
            router.push('/user/dashboard')
            router.refresh()
        } catch (error) {
            console.error('Error creating ticket:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
            <Card>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Brief description of the issue"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed explanation of your issue"
                            rows={5}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Ticket'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
} 