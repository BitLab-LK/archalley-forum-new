// WordPress API utilities for fetching blog posts
const WORDPRESS_API_URL = 'https://archalley.com/wp-json/wp/v2'

export interface WordPressPost {
  id: number
  date: string
  title: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  content: {
    rendered: string
  }
  slug: string
  link: string
  featured_media: number
  categories: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      id: number
      source_url: string
      alt_text: string
      media_details: {
        width: number
        height: number
        sizes: {
          [key: string]: {
            source_url: string
            width: number
            height: number
          }
        }
      }
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
      taxonomy: string
    }>>
  }
}

/**
 * Fetch posts from WordPress REST API
 * @param page - Page number (1-based)
 * @param perPage - Number of posts per page
 * @returns Promise<WordPressPost[]>
 */
export async function getAllPosts(page: number = 1, perPage: number = 4): Promise<WordPressPost[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&page=${page}&per_page=${perPage}&orderby=date&order=desc`,
      {
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }

    const posts: WordPressPost[] = await response.json()
    return posts
  } catch (error) {
    console.error('Error fetching WordPress posts:', error)
    // Return fallback data or empty array
    return []
  }
}

/**
 * Extract featured image URL from WordPress post
 * @param post - WordPress post object
 * @param size - Image size ('thumbnail', 'medium', 'large', 'full')
 * @returns Image URL or placeholder
 */
export function getFeaturedImageUrl(post: WordPressPost, size: string = 'large'): string {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
  
  if (!featuredMedia) {
    return '/placeholder-blog.jpg' // Fallback image
  }

  // Try to get specific size, fallback to source_url
  const sizeImage = featuredMedia.media_details?.sizes?.[size]
  return sizeImage?.source_url || featuredMedia.source_url
}

/**
 * Get featured image alt text
 * @param post - WordPress post object
 * @returns Alt text or default
 */
export function getFeaturedImageAlt(post: WordPressPost): string {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0]
  return featuredMedia?.alt_text || 'Blog post image'
}

/**
 * Extract primary category from WordPress post
 * @param post - WordPress post object
 * @returns Category object or default
 */
export function getPostCategory(post: WordPressPost): { name: string; slug: string } {
  const categories = post._embedded?.['wp:term']?.[0] // Categories are the first term array
  const primaryCategory = categories?.find(term => term.taxonomy === 'category')
  
  return {
    name: primaryCategory?.name || 'Uncategorized',
    slug: primaryCategory?.slug || 'uncategorized'
  }
}

/**
 * Strip HTML tags from WordPress content
 * @param html - HTML string
 * @returns Clean text
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Format WordPress date to readable format
 * @param dateString - WordPress date string
 * @returns Formatted date
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Get short excerpt from WordPress post
 * @param post - WordPress post object
 * @param maxLength - Maximum character length
 * @returns Clean excerpt
 */
export function getPostExcerpt(post: WordPressPost, maxLength: number = 150): string {
  const excerpt = stripHtml(post.excerpt.rendered)
  return excerpt.length > maxLength 
    ? excerpt.substring(0, maxLength) + '...'
    : excerpt
}

// Category interface
export interface WordPressCategory {
  id: number
  name: string
  slug: string
  description: string
  count: number
}

/**
 * Get all categories from WordPress
 */
export async function getAllCategories(): Promise<WordPressCategory[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/categories?per_page=100&hide_empty=true`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }
    
    const categories: WordPressCategory[] = await response.json()
    return categories
  } catch (error) {
    console.error('Error fetching WordPress categories:', error)
    return []
  }
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(categoryId: number, page: number = 1, perPage: number = 8): Promise<WordPressPost[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&categories=${categoryId}&page=${page}&per_page=${perPage}&status=publish&orderby=date&order=desc`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }
    
    const posts: WordPressPost[] = await response.json()
    return posts
  } catch (error) {
    console.error('Error fetching WordPress posts by category:', error)
    return []
  }
}

/**
 * Get commercial and office projects
 * This function specifically looks for projects related to commercial and office spaces
 */
export async function getCommercialProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find commercial/office category first
    const categories = await getAllCategories()
    const commercialCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('commercial') || 
      cat.slug.toLowerCase().includes('office') ||
      cat.name.toLowerCase().includes('commercial') ||
      cat.name.toLowerCase().includes('office')
    )
    
    // If we found a commercial category, fetch posts from that category
    if (commercialCategory) {
      console.log(`✅ Found commercial category: ${commercialCategory.name} (ID: ${commercialCategory.id})`)
      const posts = await getPostsByCategory(commercialCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No commercial category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to commercial/office based on title and content
    const commercialPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('office') ||
        title.includes('commercial') ||
        title.includes('corporate') ||
        title.includes('workplace') ||
        title.includes('business') ||
        title.includes('retail') ||
        title.includes('shop') ||
        excerpt.includes('office') ||
        excerpt.includes('commercial') ||
        excerpt.includes('corporate') ||
        excerpt.includes('workplace') ||
        excerpt.includes('business') ||
        content.includes('commercial space') ||
        content.includes('office building') ||
        content.includes('workspace')
      )
    })
    
    console.log(`📊 Found ${commercialPosts.length} commercial projects from ${posts.length} total posts`)
    return commercialPosts
    
  } catch (error) {
    console.error('Error fetching commercial projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Search posts by title and content
 */
export async function searchPosts(searchTerm: string, page: number = 1, perPage: number = 10): Promise<WordPressPost[]> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&search=${encodeURIComponent(searchTerm)}&page=${page}&per_page=${perPage}&status=publish&orderby=relevance`,
      {
        next: { revalidate: 300 },
      }
    )
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }
    
    const posts: WordPressPost[] = await response.json()
    return posts
  } catch (error) {
    console.error('Error searching WordPress posts:', error)
    return []
  }
}

/**
 * Get project details by slug
 */
export async function getProjectBySlug(slug: string): Promise<WordPressPost | null> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&slug=${slug}&status=publish`,
      {
        next: { revalidate: 300 },
      }
    )
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }
    
    const posts: WordPressPost[] = await response.json()
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('Error fetching project by slug:', error)
    return null
  }
}