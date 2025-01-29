import { Database } from './database'

type BaseKBArticle = Database['public']['Tables']['kb_articles']['Row']

interface User {
    id: string
    full_name: string | null
}

export interface KBArticle {
    id: string
    title: string
    content: string
    slug: string | null
    status: ArticleStatus | null
    tags: string[]
    created_at: string
    updated_at: string
    created_by: User | null
    approved_by: User | null
    approver: User | null
    category_id: string | null
    category?: {
        id: string
        name: string
    }
    creator?: User
    content_format: string | null
    metadata: any
    version: number | null
}

export type KBCategory = Database['public']['Tables']['kb_categories']['Row']

export type ArticleStatus = 'draft' | 'published' | 'archived'
export type SourceType = 'manual' | 'pdf' | 'doc' | 'docx' | 'md'

export interface CreateArticleRequest {
    title: string
    content: string
    category_id?: string
    source_type?: SourceType
    source_url?: string
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
    status?: ArticleStatus
}

export interface ChunkData {
    content: string
    metadata?: Record<string, any>
} 