'use client'

import { KBArticle } from '@/types/kb'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Clock, Edit, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useKB } from '@/hooks/use-kb'
import { useToast } from '@/hooks/use-toast'
import { MarkdownRenderer } from './markdown-renderer'

interface ArticlePreviewProps {
    article: KBArticle
    onApprove?: () => void
    onEdit?: () => void
    onDelete?: () => void
}

export function ArticlePreview({ article, onApprove, onEdit, onDelete }: ArticlePreviewProps) {
    const { loading, approveArticle } = useKB()
    const { toast } = useToast()

    const handleApprove = async () => {
        try {
            await approveArticle(article.id)
            toast({
                title: 'Success',
                description: 'Article approved successfully'
            })
            onApprove?.()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to approve article',
                variant: 'destructive'
            })
        }
    }

    return (
        <Card className="p-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                    <div className="text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status}
                    </Badge>
                    {article.category?.name && (
                        <Badge variant="outline">{article.category.name}</Badge>
                    )}
                </div>
            </div>

            {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <MarkdownRenderer content={article.content} />
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                    {(article.created_by?.full_name || article.creator?.full_name) && (
                        <span>By {article.created_by?.full_name || article.creator?.full_name}</span>
                    )}
                </div>
                <div className="flex gap-2">
                    {article.status === 'draft' && (
                        <Button
                            onClick={handleApprove}
                            disabled={loading}
                            size="sm"
                            variant="outline"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                        </Button>
                    )}
                    <Button
                        onClick={onEdit}
                        size="sm"
                        variant="outline"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        onClick={onDelete}
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>
        </Card>
    )
} 