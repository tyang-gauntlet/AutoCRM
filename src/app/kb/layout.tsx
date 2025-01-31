import { Metadata } from 'next'
import { KBHeader } from './components/header'

export const metadata: Metadata = {
    title: {
        default: 'Knowledge Base',
        template: '%s | Knowledge Base'
    },
    description: 'Knowledge base articles and documentation'
}

export default function KBLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <KBHeader />
            {children}
        </div>
    )
} 