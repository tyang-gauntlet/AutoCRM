import { NextPage } from 'next'
import { ReactNode } from 'react'

export type PageParams = {
    [key: string]: string
}

export type PageProps<P = PageParams> = {
    params: P
    searchParams?: { [key: string]: string | string[] | undefined }
}

export type NextPageWithParams<P = PageParams> = NextPage<PageProps<P>>

export interface LayoutProps {
    children: ReactNode
} 