export type Tool = (params: any) => Promise<any>

export interface ToolCall {
    id: string
    name: string
    start_time: string
    end_time?: string
    result?: any
    error?: string
} 