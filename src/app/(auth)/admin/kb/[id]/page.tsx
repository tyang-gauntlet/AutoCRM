'use client'

import { useState, useEffect } from 'react'
import { useKB } from '@/hooks/use-kb'
import { KBArticle, CreateArticleRequest } from '@/types/kb'
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

export default function ArticleEditorPage({ params }: { params: { id: string } }) {
    const { loading, getArticle, updateArticle } = useKB()
    const { toast } = useToast()
    const [article, setArticle] = useState<KBArticle | null>(null)
    const [openTags, setOpenTags] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    useEffect(() => {
        if (params.id !== 'new') {
            loadArticle()
        }
    }, [params.id])

    const loadArticle = async () => {
        try {
            const data = await getArticle(params.id)
            setArticle(data)
            setSelectedTags(data.tags || [])
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
                        value={article?.title || ''}
                        onChange={(e) => setArticle(prev => ({
                            ...prev!,
                            title: e.target.value
                        }))}
                    />

                    <Input
                        placeholder="URL"
                        value={article?.source_url || ''}
                        onChange={(e) => setArticle(prev => ({
                            ...prev!,
                            source_url: e.target.value
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
                        value={article?.content || ''}
                        onChange={(e) => setArticle(prev => ({
                            ...prev!,
                            content: e.target.value
                        }))}
                        className="min-h-[400px]"
                    />
                </div>

                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Preview</h3>
                    <div className="prose prose-sm max-w-none">
                        {/* Add markdown preview here */}
                    </div>
                </div>
            </div>
        </div>
    )
} 