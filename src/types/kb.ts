import { Database } from './database'

type BaseKBArticle = Database['public']['Tables']['kb_articles']['Row']

export type KBArticle = BaseKBArticle & {
    category?: {
        id: string
        name: string
    }
    creator?: {
        id: string
        full_name: string | null
    }
    approver?: {
        id: string
        full_name: string | null
    }
    created_by?: {
        id: string
        full_name: string | null
    }
    approved_by?: {
        id: string
        full_name: string | null
    }
    tags?: string[]
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