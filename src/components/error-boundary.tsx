'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                    <pre className="bg-muted p-4 rounded overflow-auto">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            )
        }

        return this.props.children
    }
} 