import { getAllCategories, getPostsByCategory, type WordPressPost } from "@/lib/wordpress-api"
import NewsSection from "@/components/news-section"

export default async function ServerNewsSection() {
  try {
    // Fetch categories to find the news category ID
    const categories = await getAllCategories()
    const newsCategoryId = categories.find((cat) => cat.slug === "news")?.id || 0
    
    let news: WordPressPost[] = []
    if (newsCategoryId > 0) {
      // Fetch news posts
      news = await getPostsByCategory(newsCategoryId, 1, 6)
    }
    
    return <NewsSection initialNews={news} initialCategories={categories} />
  } catch (error) {
    console.error('Failed to fetch news on server:', error)
    // Fall back to client-side fetching
    return <NewsSection />
  }
}