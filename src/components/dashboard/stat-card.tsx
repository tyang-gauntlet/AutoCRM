import React from 'react'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    change?: string
    icon: LucideIcon
    iconColor?: string
}

export function StatCard({ title, value, change, icon: Icon, iconColor = 'text-primary' }: StatCardProps) {
    return (
        <Card className="p-6">
            <Icon className={`h-8 w-8 mb-4 ${iconColor}`} />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">{value}</p>
                {change && (
                    <span className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {change}
                    </span>
                )}
            </div>
        </Card>
    )
} 