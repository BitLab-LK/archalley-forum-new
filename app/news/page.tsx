import { Metadata } from "next"
import { getAllCategories, getPostsByCategory, type WordPressPost } from "@/lib/wordpress-api"
import NewsPageClient from "./news-page-client"

// Force dynamic rendering to avoid build timeouts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Architecture News | Archalley - Latest Industry Updates",
  description: "Stay updated with the latest architecture news, design trends, industry regulations, and innovative projects from around the world. Breaking news and insights from the architecture community.",
  keywords: "architecture news, design trends, building regulations, construction news, architectural projects, industry updates, sustainable architecture, urban planning",
}

export default async function NewsPage() {
  try {
    // Fetch categories to find the news category ID
    const categories = await getAllCategories()
    const newsCategoryId = categories.find((cat) => cat.slug === "news")?.id || 0
    
    let news: WordPressPost[] = []
    if (newsCategoryId > 0) {
      // Fetch more news posts for the dedicated news page (20 posts)
      news = await getPostsByCategory(newsCategoryId, 1, 20)
    }
    
    return <NewsPageClient initialNews={news} initialCategories={categories} />
  } catch (error) {
    console.error('Failed to fetch news on server:', error)
    // Fall back to client-side fetching
    return <NewsPageClient />
  }
}