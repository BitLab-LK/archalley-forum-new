import { Metadata } from "next"
import { getAllCategories, getNewsPosts } from "@/lib/wordpress-api"
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
    // Fetch news posts from category ID 42
    const news = await getNewsPosts(1, 20)
    const categories = await getAllCategories()
    
    console.log(`✅ News page: Fetched ${news.length} news posts from WordPress`)
    return <NewsPageClient initialNews={news} initialCategories={categories} />
  } catch (error) {
    console.error('❌ News page: Error fetching news:', error)
    // Fall back to client-side fetching
    return <NewsPageClient />
  }
}