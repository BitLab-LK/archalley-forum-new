// Instagram API integration for fetching posts
import { SOCIAL_MEDIA } from "@/lib/constants"

export interface InstagramPost {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  caption?: string
  timestamp: string
  thumbnail_url?: string
}

// Instagram Access Token (replace with your actual token)
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || 'your_instagram_access_token'

/**
 * Fetch Instagram posts using Instagram Basic Display API
 * @param limit - Number of posts to fetch (max 25)
 * @returns Promise<InstagramPost[]>
 */
export async function fetchInstagramPosts(limit: number = 12): Promise<InstagramPost[]> {
  // Check if we have a valid access token
  if (!INSTAGRAM_ACCESS_TOKEN || INSTAGRAM_ACCESS_TOKEN === 'your_instagram_access_token') {
    console.log('Instagram API: Using mock data (no valid access token)')
    return generateMockInstagramPosts(limit)
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,caption,timestamp,thumbnail_url&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      console.log(`Instagram API error: ${response.status}, falling back to mock data`)
      return generateMockInstagramPosts(limit)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching Instagram posts:', error)
    
    // Return mock data for development/fallback
    return generateMockInstagramPosts(limit)
  }
}

/**
 * Generate mock Instagram posts for development
 */
function generateMockInstagramPosts(limit: number): InstagramPost[] {
  const mockPosts: InstagramPost[] = []
  
  for (let i = 1; i <= limit; i++) {
    mockPosts.push({
      id: `mock_post_${i}`,
      media_type: 'IMAGE',
      media_url: `https://picsum.photos/400/400?random=${i}`,
      permalink: `${SOCIAL_MEDIA.instagram}/p/mock_post_${i}`,
      caption: `Beautiful architectural design #${i} showcasing modern innovation and sustainable practices. #architecture #design #innovation`,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  
  return mockPosts
}

/**
 * Format Instagram timestamp to readable date
 */
export function formatInstagramDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '1 day ago'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.ceil(diffDays / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

/**
 * Truncate Instagram caption
 */
export function truncateCaption(caption: string = '', maxLength: number = 100): string {
  if (caption.length <= maxLength) return caption
  return caption.substring(0, maxLength).trim() + '...'
}