import { getAllPosts } from "@/lib/wordpress-api"
import BlogCarousel from "@/components/blog-carousel"

export default async function ServerBlogCarousel() {
  try {
    // Fetch 12 posts so there's content to slide through
    const posts = await getAllPosts(1, 12)
    return <BlogCarousel initialPosts={posts} />
  } catch (error) {
    console.error('Failed to fetch posts on server:', error)
    // Fall back to client-side fetching
    return <BlogCarousel />
  }
}