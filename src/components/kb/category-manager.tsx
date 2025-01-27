'use client'

import { useState, useEffect } from 'react'
import { useKB } from '@/hooks/use-kb'
import { KBCategory } from '@/types/kb'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CategoryManagerProps {
    onCategoryChange?: (category: KBCategory) => void
}

export function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
    const [categories, setCategories] = useState<KBCategory[]>([])
    const [newCategory, setNewCategory] = useState({ name: '', slug: '' })
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const supabase = createClientComponentClient()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('kb_categories')
                .select('*')
                .order('name')

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load categories',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCategory = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('kb_categories')
                .insert({
                    name: newCategory.name,
                    slug: newCategory.name.toLowerCase().replace(/\s+/g, '-')
                })
                .select()
                .single()

            if (error) throw error

            setCategories(prev => [...prev, data])
            setNewCategory({ name: '', slug: '' })
            toast({
                title: 'Success',
                description: 'Category created successfully'
            })
            onCategoryChange?.(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create category',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        try {
            setLoading(true)
            const { error } = await supabase
                .from('kb_categories')
                .delete()
                .eq('id', id)

            if (error) throw error

            setCategories(prev => prev.filter(cat => cat.id !== id))
            toast({
                title: 'Success',
                description: 'Category deleted successfully'
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete category',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({
                            ...prev,
                            name: e.target.value
                        }))}
                        placeholder="New category name"
                        disabled={loading}
                    />
                    <Button
                        onClick={handleCreateCategory}
                        disabled={!newCategory.name || loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Add
                    </Button>
                </div>

                <div className="space-y-2">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                        >
                            <span>{category.name}</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
} 