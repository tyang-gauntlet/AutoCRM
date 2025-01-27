import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ArticleNotFound() {
    return (
        <div className="container max-w-4xl mx-auto py-10 text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
                The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
                <Link href="/kb">
                    Back to Knowledge Base
                </Link>
            </Button>
        </div>
    )
} 