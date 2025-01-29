export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

export interface ChatState {
    messages: ChatMessage[]
    isLoading: boolean
} 