import { Metadata } from 'next'
import CategoryListing from "@/components/category-listing"

// Force dynamic rendering to avoid build timeouts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Architecture Articles | Archalley',
  description: 'Discover in-depth articles, research papers, and expert insights on architecture, design theory, and construction technology.',
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams
  const pageParam = typeof resolvedSearchParams?.page === 'string' ? resolvedSearchParams.page : Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams.page[0] : null
  // New standardized category listing (Articles = categoryId 41)
  return <CategoryListing categoryId={41} title="Articles" basePath="/articles" pageParam={pageParam} />
}