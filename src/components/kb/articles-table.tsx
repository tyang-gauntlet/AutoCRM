'use client'

import { useState } from 'react'
import { KBArticle } from '@/types/kb'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { useRouter } from 'next/navigation'
import { ColumnDef, CellContext, flexRender, VisibilityState, OnChangeFn } from '@tanstack/react-table'
import { Database } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ArticlesTableProps {
    articles: KBArticle[]
    onEdit: (article: KBArticle) => void
    onDelete: (article: KBArticle) => void
    hideSearch?: boolean
    columnVisibility?: VisibilityState
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>
    renderActions?: (article: KBArticle) => React.ReactNode
}

const columnLabels: Record<string, string> = {
    title: 'Title',
    content: 'Content Preview',
    status: 'Status',
    tags: 'Tags',
}

export function ArticlesTable({
    articles,
    onEdit,
    onDelete,
    hideSearch,
    columnVisibility = {},
    onColumnVisibilityChange,
    renderActions
}: ArticlesTableProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [articleToDelete, setArticleToDelete] = useState<KBArticle | null>(null)

    const handleDelete = (article: KBArticle) => {
        setArticleToDelete(article)
    }

    const confirmDelete = () => {
        if (articleToDelete && onDelete) {
            onDelete(articleToDelete)
        }
        setArticleToDelete(null)
    }

    const getArticleTitle = (article: KBArticle | null) => {
        if (!article) return ''
        const dbArticle = article as KBArticle & Database['public']['Tables']['kb_articles']['Row']
        return dbArticle.title
    }

    const tableColumns = columns({
        onEdit,
        onDelete: handleDelete
    }).map(col => ({
        ...col,
        cell: (context: CellContext<KBArticle, unknown>) => {
            const element = flexRender(col.cell, context)
            if (col.id === 'actions') return element

            return (
                <div
                    onClick={() => {
                        const article = context.row.original as KBArticle & Database['public']['Tables']['kb_articles']['Row']
                        router.push(`/kb/${article.id}`)
                    }}
                    className="cursor-pointer"
                >
                    {element}
                </div>
            )
        }
    })) as ColumnDef<KBArticle>[]

    return (
        <div className="space-y-4">
            {!hideSearch && (
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="article-search"
                            name="article-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="pl-10"
                        />
                    </div>
                </div>
            )}
            <DataTable
                columns={tableColumns}
                data={articles}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={onColumnVisibilityChange}
            />

            <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the article "{getArticleTitle(articleToDelete)}".
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 