'use client'

import { useState, useEffect } from 'react'
import { useKB } from '@/hooks/use-kb'
import { KBArticle, CreateArticleRequest } from '@/types/kb'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X } from 'lucide-react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { cn } from '@/lib/utils'

interface ArticleEditorProps {
    article?: KBArticle
    onSave: (data: CreateArticleRequest) => Promise<void>
    onCancel: () => void
}

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
    const [formData, setFormData] = useState<CreateArticleRequest>({
        title: (article as any)?.title ?? '',
        content: (article as any)?.content ?? '',
        category_id: (article as any)?.category?.id,
        source_type: 'manual'
    })
    const [preview, setPreview] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        updatePreview(formData.content)
    }, [formData.content])

    const updatePreview = async (content: string) => {
        try {
            const result = await unified()
                .use(remarkParse)
                .use(remarkGfm)
                .use(remarkRehype)
                .use(rehypeStringify)
                .process(content)
            setPreview(result.toString())
        } catch (error) {
            console.error('Failed to generate preview:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            await onSave(formData)
            toast({
                title: 'Success',
                description: 'Article saved successfully'
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save article',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Title
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    title: e.target.value
                                }))}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Content (Markdown)
                            </label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    content: e.target.value
                                }))}
                                rows={20}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-4">
                            Preview
                        </label>
                        <div
                            className={cn(
                                "prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 min-h-[200px]",
                                // Headings
                                "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
                                "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-4",
                                "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
                                // Paragraphs and spacing
                                "[&_p]:my-4 [&_p]:leading-7",
                                // Lists
                                "[&_ul]:!list-disc [&_ul]:!pl-6 [&_ul]:my-2",
                                "[&_ol]:!list-decimal [&_ol]:!pl-6 [&_ol]:my-2",
                                "[&_li]:my-0.5",
                                // Code blocks
                                "[&_pre]:!bg-muted/50 [&_pre]:!p-4 [&_pre]:!mt-6 [&_pre]:!mb-6 [&_pre]:!rounded-lg",
                                "[&_pre_code]:!bg-transparent [&_pre_code]:!p-0",
                                // Links
                                "[&_a]:text-primary [&_a]:underline [&_a]:font-medium",
                                // Strong and emphasis
                                "[&_strong]:font-bold [&_em]:italic"
                            )}
                            dangerouslySetInnerHTML={{ __html: preview }}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                </div>
            </form>
        </Card>
    )
} 