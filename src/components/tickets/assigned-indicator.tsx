import { CheckCircle2 } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface AssignedIndicatorProps {
    name?: string
}

export function AssignedIndicator({ name }: AssignedIndicatorProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </TooltipTrigger>
                <TooltipContent>
                    {name ? `Assigned to ${name}` : 'Assigned to you'}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
} 