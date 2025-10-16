import { fetchInstagramPosts, type InstagramPost } from "@/app/actions/instagram"
import InstagramSlider from "@/components/instagram-slider"

export default async function ServerInstagramSlider() {
  try {
    // Fetch Instagram posts on the server
    const instagramPosts: InstagramPost[] = await fetchInstagramPosts(12)
    
    return <InstagramSlider initialPosts={instagramPosts} />
  } catch (error) {
    console.error('Failed to fetch Instagram posts on server:', error)
    // Fall back to client-side fetching
    return <InstagramSlider />
  }
}