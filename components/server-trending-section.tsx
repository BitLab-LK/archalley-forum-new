import { getAllPosts, type WordPressPost } from "@/lib/wordpress-api"
import TrendingSection from "@/components/trending-section"

export default async function ServerTrendingSection() {
  try {
    // Fetch latest posts for trending section
    const trendingPosts: WordPressPost[] = await getAllPosts(1, 4)
    
    return <TrendingSection initialPosts={trendingPosts} />
  } catch (error) {
    console.error('Failed to fetch trending posts on server:', error)
    // Fall back to client-side fetching
    return <TrendingSection />
  }
}