'use client'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className=" bg-background">
            {/* Admin-specific navigation and layout */}
            {children}
        </div>
    )
} 