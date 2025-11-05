import { Metadata } from 'next'
import CategoryListing from "@/components/category-listing"

// Force dynamic rendering to avoid build timeouts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Architecture Articles | Archalley',
  description: 'Discover in-depth articles, research papers, and expert insights on architecture, design theory, and construction technology.',
}

export default async function ArticlesPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  // New standardized category listing (Articles = categoryId 41)
  return <CategoryListing categoryId={41} title="Articles" basePath="/articles" pageParam={pageParam} />
}