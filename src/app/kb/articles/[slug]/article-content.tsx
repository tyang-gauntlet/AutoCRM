'use client'
import React from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeStringify from 'rehype-stringify'
import { createHighlighter } from 'shiki'
import { cn } from '@/lib/utils'

const rehypePrettyCodeOptions = {
    getHighlighter: () => createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: ['typescript', 'javascript', 'jsx', 'tsx', 'html', 'css', 'json', 'markdown', 'bash', 'shell', 'http']
    }),
    keepBackground: true,
    defaultLang: 'plaintext',
    theme: {
        dark: 'github-dark',
        light: 'github-light'
    }
} as const

interface ArticleContentProps {
    content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
    const [htmlContent, setHtmlContent] = React.useState<string>('')

    React.useEffect(() => {
        const processContent = async () => {
            try {
                const contentWithoutTitle = content.replace(/^#\s+.*\n/, '')
                const processedContent = await unified()
                    .use(remarkParse)
                    .use(remarkGfm)
                    .use(remarkRehype)
                    .use(rehypePrettyCode, rehypePrettyCodeOptions)
                    .use(rehypeStringify)
                    .process(contentWithoutTitle)

                setHtmlContent(processedContent.toString())
            } catch (err) {
                console.error('Error processing markdown:', err)
            }
        }

        processContent()
    }, [content])

    return (
        <article
            className={cn(
                "prose dark:prose-invert max-w-none",
                // Headings
                "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
                "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-4",
                "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
                // Paragraphs and spacing
                "[&_p]:my-4 [&_p]:leading-7",
                // Code blocks
                "[&_pre]:!bg-muted/50 [&_pre]:!p-4 [&_pre]:!mt-6 [&_pre]:!mb-6 [&_pre]:!rounded-lg",
                "[&_pre_code]:!bg-transparent [&_pre_code]:!p-0",
                "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-[0.4em] [&_code]:py-[0.2em]",
                "[&_code]:font-mono [&_code]:text-sm",
                // Tables
                "[&_table]:!mt-6 [&_table]:!mb-6 [&_table]:w-full",
                "[&_thead_tr]:!border-b [&_thead_tr]:!border-border",
                "[&_tbody_tr]:!border-b [&_tbody_tr]:!border-border",
                "[&_tbody_tr:last-child]:!border-0",
                "[&_thead_th]:!p-3 [&_thead_th]:!text-left",
                "[&_tbody_td]:!p-3",
                // Lists
                "[&_ul]:!list-disc [&_ul]:!pl-6 [&_ul]:my-4",
                "[&_ol]:!list-decimal [&_ol]:!pl-6 [&_ol]:my-4",
                "[&_li]:my-1",
                // Links
                "[&_a]:text-primary [&_a]:underline [&_a]:font-medium",
                // Blockquotes
                "[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
                // Strong and emphasis
                "[&_strong]:font-bold [&_em]:italic"
            )}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    )
} 