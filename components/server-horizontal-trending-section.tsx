import { getAllPosts, type WordPressPost } from "@/lib/wordpress-api"
import HorizontalTrendingSection from "@/components/horizontal-trending-section"

export default async function ServerHorizontalTrendingSection() {
  try {
    // Fetch latest posts for trending section
    const trendingPosts: WordPressPost[] = await getAllPosts(1, 8)
    
    return <HorizontalTrendingSection initialPosts={trendingPosts} />
  } catch (error) {
    console.error('Failed to fetch trending posts on server:', error)
    // Fall back to client-side fetching
    return <HorizontalTrendingSection />
  }
}