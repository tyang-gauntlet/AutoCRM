"use client"

import { ColumnDef } from "@tanstack/react-table"
import { KBArticle } from "@/types/kb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActionsProps {
    article: KBArticle
    onEdit?: (article: KBArticle) => void
    onDelete?: (article: KBArticle) => void
}

const Actions = ({ article, onEdit, onDelete }: ActionsProps) => {
    return (
        <div className="action-menu">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(article)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onDelete?.(article)}
                        className="text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export interface ArticleColumnsProps {
    onEdit?: (article: KBArticle) => void
    onDelete?: (article: KBArticle) => void
}

export const columns = ({
    onEdit,
    onDelete,
}: ArticleColumnsProps): ColumnDef<KBArticle>[] => [
        {
            accessorKey: "title",
            header: "Title",
            id: "title",
            cell: ({ row }) => {
                const title = row.getValue("title") as string
                return <div className="font-medium">{title}</div>
            },
        },
        {
            accessorKey: "content",
            header: "Content Preview",
            id: "content",
            cell: ({ row }) => {
                const content = row.getValue("content") as string
                return (
                    <div className="truncate max-w-[400px]">
                        {content.replace(/^#\s.*\n/, '').replace(/\n/g, ' ')}
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            id: "status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        variant={status === 'published' ? 'default' : 'secondary'}
                        className="capitalize"
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "tags",
            header: "Tags",
            id: "tags",
            cell: ({ row }) => {
                const tags = row.getValue("tags") as string[]
                return (
                    <div className="flex gap-1 flex-wrap">
                        {Array.isArray(tags) && tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs whitespace-nowrap"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const article = row.original
                return <Actions article={article} onEdit={onEdit} onDelete={onDelete} />
            },
        },
    ] 
