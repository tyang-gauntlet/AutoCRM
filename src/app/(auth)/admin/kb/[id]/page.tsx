'use client'

import { useState, useEffect } from 'react'
import { useKB } from '@/hooks/use-kb'
import { KBArticle } from '@/types/kb'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import Link from 'next/link'

const AVAILABLE_TAGS = [
    'getting-started',
    'troubleshooting',
    'api',
    'security',
    'deployment',
    'configuration',
    'best-practices',
    'faq'
]

type KBParams = {
    id: string
}

interface Props {
    params: KBParams
    searchParams?: { [key: string]: string | string[] | undefined }
}

export default function KBArticlePage({ params }: Props) {
    const { id } = params
    const { getArticle } = useKB()
    const { toast } = useToast()
    const [article, setArticle] = useState<KBArticle | null>(null)
    const [openTags, setOpenTags] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [preview, setPreview] = useState('')

    useEffect(() => {
        if (id !== 'new') {
            loadArticle()
        }
    }, [id])

    useEffect(() => {
        updatePreview((article as any)?.content || '')
    }, [(article as any)?.content])

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

    const loadArticle = async () => {
        try {
            const data = await getArticle(id)
            if (data) {
                setArticle(data as KBArticle)
                setSelectedTags(data.tags || [])
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load article',
                variant: 'destructive'
            })
        }
    }

    const handleTagSelect = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag))
        } else {
            setSelectedTags(prev => [...prev, tag])
        }
    }

    const removeTag = (tagToRemove: string) => {
        setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove))
    }

    return (
        <div className="container max-w-7xl mx-auto py-10">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <Input
                        placeholder="Title"
                        value={(article as any)?.title || ''}
                        onChange={(e) => setArticle(prev => ({
                            ...prev!,
                            title: e.target.value
                        }))}
                    />

                    <div>
                        <div className="flex gap-2 mb-2">
                            {selectedTags.map(tag => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                    <button
                                        className="ml-1 hover:text-destructive"
                                        onClick={() => removeTag(tag)}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Popover open={openTags} onOpenChange={setOpenTags}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openTags}
                                    className="w-full justify-between"
                                >
                                    Select tags...
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                                <Command>
                                    <CommandInput placeholder="Search tags..." />
                                    <CommandEmpty>No tags found.</CommandEmpty>
                                    <CommandGroup>
                                        {AVAILABLE_TAGS.map(tag => (
                                            <CommandItem
                                                key={tag}
                                                onSelect={() => handleTagSelect(tag)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {tag}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Textarea
                        placeholder="Content (Markdown)"
                        value={(article as any)?.content || ''}
                        onChange={(e) => setArticle(prev => ({
                            ...prev!,
                            content: e.target.value
                        }))}
                        className="min-h-[400px]"
                    />
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Preview</h3>
                    <div
                        className={cn(
                            "prose dark:prose-invert max-w-none",
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
                    {article?.slug && (
                        <Button asChild>
                            <Link
                                href={`/kb/articles/${article.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Published
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
} 