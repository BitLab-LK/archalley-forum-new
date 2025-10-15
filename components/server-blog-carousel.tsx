import { getAllPosts } from "@/lib/wordpress-api"
import BlogCarousel from "@/components/blog-carousel"

export default async function ServerBlogCarousel() {
  try {
    const posts = await getAllPosts(1, 4)
    return <BlogCarousel initialPosts={posts} />
  } catch (error) {
    console.error('Failed to fetch posts on server:', error)
    // Fall back to client-side fetching
    return <BlogCarousel />
  }
}