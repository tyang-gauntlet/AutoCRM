'use client'

import React, { ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
    content: string
    className?: string
}

type CodeProps = ComponentPropsWithoutRef<'code'> & {
    inline?: boolean
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <ReactMarkdown
            className={cn("prose dark:prose-invert max-w-none", className)}
            remarkPlugins={[remarkGfm]}
            components={{
                code: ({ inline, className, children, ...props }: CodeProps) => {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''

                    if (language === 'chart' || language === 'mermaid') {
                        return <div className="text-sm text-muted-foreground">Chart/diagram rendering not supported in preview</div>
                    }

                    return !inline && language ? (
                        <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={language}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    )
                }
            }}
        >
            {content}
        </ReactMarkdown>
    )
} 