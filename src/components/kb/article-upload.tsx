'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ArticleUploadProps {
    categories: {
        id: string
        name: string
    }[]
}

export function ArticleUpload({ categories }: ArticleUploadProps) {
    const [isUploading, setIsUploading] = React.useState(false)
    const [title, setTitle] = React.useState('')
    const [categoryId, setCategoryId] = React.useState('')
    const [file, setFile] = React.useState<File | null>(null)
    const { toast } = useToast()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !title || !categoryId) {
            toast({
                title: 'Missing Fields',
                description: 'Please fill in all required fields',
                variant: 'destructive'
            })
            return
        }

        try {
            setIsUploading(true)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', title)
            formData.append('categoryId', categoryId)

            const response = await fetch('/api/kb/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Failed to upload article')
            }

            const data = await response.json()

            toast({
                title: 'Success',
                description: 'Article uploaded successfully'
            })

            // Redirect to the article page
            router.push(`/admin/kb/${data.article.id}`)

        } catch (error) {
            console.error('Upload error:', error)
            toast({
                title: 'Error',
                description: 'Failed to upload article. Please try again.',
                variant: 'destructive'
            })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Article title"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="file">Markdown File</Label>
                <Input
                    id="file"
                    type="file"
                    accept=".md"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                />
            </div>

            <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Article'}
            </Button>
        </form>
    )
} 