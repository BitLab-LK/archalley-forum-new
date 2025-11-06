import { Metadata } from "next"
import CategoryListing from "@/components/category-listing"

// Force dynamic rendering to avoid build timeouts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Architecture News | Archalley - Latest Industry Updates",
  description: "Stay updated with the latest architecture news, design trends, industry regulations, and innovative projects from around the world. Breaking news and insights from the architecture community.",
  keywords: "architecture news, design trends, building regulations, construction news, architectural projects, industry updates, sustainable architecture, urban planning",
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams
  const pageParam = typeof resolvedSearchParams?.page === 'string' ? resolvedSearchParams.page : Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams.page[0] : null
  // New standardized category listing (News = categoryId 42)
  return <CategoryListing categoryId={42} title="News" basePath="/news" pageParam={pageParam} />
}