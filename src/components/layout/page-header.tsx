import React from 'react'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
    title: string
    description?: string
    action?: {
        label: string
        icon?: LucideIcon
        onClick: () => void
    }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    const Icon = action?.icon

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                {description && (
                    <p className="text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {action.label}
                </Button>
            )}
        </div>
    )
} 