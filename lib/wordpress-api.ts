// WordPress API utilities for fetching blog posts

/**
 * Get WordPress API URL from environment variables
 * Throws an error if WORDPRESS_API_URL is not set
 */
function getWordPressApiUrl(): string {
  const apiUrl = process.env.WORDPRESS_API_URL
  if (!apiUrl) {
    throw new Error(
      'WORDPRESS_API_URL environment variable is not set. Please configure it in your .env file.'
    )
  }
  return apiUrl
}

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
  tags?: number[]
  acf?: {
    photos?: number[]
    architects?: string
    photographers?: string
    sponsored?: boolean
    sponsor?: string | null
  }
  meta?: {
    _acf_changed?: boolean
    footnotes?: string
  }
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
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&page=${page}&per_page=${perPage}&orderby=date&order=desc`,
      {
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      }
    )

    if (!response.ok) {
      console.error(`WordPress API error: ${response.status} ${response.statusText}`)
      return []
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`WordPress API returned non-JSON response. Content-Type: ${contentType}, Preview: ${text.substring(0, 200)}`)
      return []
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
 * Decode common HTML entities (including numeric) to plain text
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) return ''
  // Basic named entities
  const named = input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // Numeric decimal entities: &#8211;
  const numericDec = named.replace(/&#(\d+);/g, (_, dec) => {
    const code = parseInt(dec, 10)
    return Number.isFinite(code) ? String.fromCharCode(code) : _
  })
  // Numeric hex entities: &#x2013;
  const numericHex = numericDec.replace(/&#x([\da-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16)
    return Number.isFinite(code) ? String.fromCharCode(code) : _
  })
  return numericHex
}

/**
 * Convenience: strip HTML tags and decode entities
 */
export function cleanText(html: string): string {
  return decodeHtmlEntities(stripHtml(html))
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
  const excerpt = cleanText(post.excerpt.rendered)
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
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/categories?per_page=100&hide_empty=true`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )
    
    if (!response.ok) {
      console.error(`WordPress API error: ${response.status} ${response.statusText}`)
      return []
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`WordPress API returned non-JSON response. Content-Type: ${contentType}, Preview: ${text.substring(0, 200)}`)
      return []
    }
    
    const categories: WordPressCategory[] = await response.json()
    return categories
  } catch (error) {
    console.error('Error fetching WordPress categories:', error)
    return []
  }
}

/**
 * Get category by slug from WordPress
 */
export async function getCategoryBySlug(slug: string): Promise<WordPressCategory | null> {
  try {
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/categories?slug=${encodeURIComponent(slug)}&per_page=1`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )
    
    if (!response.ok) {
      console.error(`WordPress API error for slug "${slug}": ${response.status} ${response.statusText}`)
      return null
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`WordPress API returned non-JSON response for slug "${slug}". Content-Type: ${contentType}, Preview: ${text.substring(0, 200)}`)
      return null
    }
    
    const categories: WordPressCategory[] = await response.json()
    return categories.length > 0 ? categories[0] : null
  } catch (error) {
    console.error(`Error fetching WordPress category by slug "${slug}":`, error)
    return null
  }
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(categoryId: number, page: number = 1, perPage: number = 8): Promise<WordPressPost[]> {
  try {
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&categories=${categoryId}&page=${page}&per_page=${perPage}&status=publish&orderby=date&order=desc`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )
    
    if (!response.ok) {
      console.error(`WordPress API error for category ${categoryId}: ${response.status} ${response.statusText}`)
      return []
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`WordPress API returned non-JSON response for category ${categoryId}. Content-Type: ${contentType}, Preview: ${text.substring(0, 200)}`)
      return []
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
 * Fetch posts from category ID 50 (Commercial & Offices)
 */
export async function getCommercialProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🏢 Fetching commercial projects from category ID 50')
    const posts = await getPostsByCategory(50, page, perPage)
    console.log(`📊 Found ${posts.length} commercial projects`)
    return posts
  } catch (error) {
    console.error('Error fetching commercial projects:', error)
    return []
  }
}

/**
 * Get hospitality architecture projects
 * Fetch posts from category ID 51 (Hospitality Architecture)
 */
export async function getHospitalityProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🏨 Fetching hospitality projects from category ID 51')
    const posts = await getPostsByCategory(51, page, perPage)
    console.log(`📊 Found ${posts.length} hospitality projects`)
    return posts
  } catch (error) {
    console.error('Error fetching hospitality projects:', error)
    return []
  }
}

/**
 * Get industrial and infrastructure projects
 * Fetch posts from category ID 54 (Industrial & Infrastructure)
 */
export async function getIndustrialProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🏭 Fetching industrial projects from category ID 54')
    const posts = await getPostsByCategory(54, page, perPage)
    console.log(`📊 Found ${posts.length} industrial projects`)
    return posts
  } catch (error) {
    console.error('Error fetching industrial projects:', error)
    return []
  }
}

/**
 * Get interior design projects
 * Fetch posts from category ID 48 (Interior Design)
 */
export async function getInteriorProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🏠 Fetching interior design projects from category ID 48')
    const posts = await getPostsByCategory(48, page, perPage)
    console.log(`📊 Found ${posts.length} interior design projects`)
    return posts
  } catch (error) {
    console.error('Error fetching interior design projects:', error)
    return []
  }
}

/**
 * Get landscape and urbanism projects
 * Fetch posts from category ID 55 (Landscape & Urbanism)
 */
export async function getLandscapeProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🌳 Fetching landscape projects from category ID 55')
    const posts = await getPostsByCategory(55, page, perPage)
    console.log(`📊 Found ${posts.length} landscape projects`)
    return posts
  } catch (error) {
    console.error('Error fetching landscape projects:', error)
    return []
  }
}

/**
 * Get public architecture projects
 * Fetch posts from category ID 52 (Public Architecture)
 */
export async function getPublicProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🏛️ Fetching public architecture projects from category ID 52')
    const posts = await getPostsByCategory(52, page, perPage)
    console.log(`📊 Found ${posts.length} public architecture projects`)
    return posts
  } catch (error) {
    console.error('Error fetching public architecture projects:', error)
    return []
  }
}

/**
 * Get refurbishment projects
 * Fetch posts from category ID 49 (Refurbishment)
 */
export async function getRefurbishmentProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🔨 Fetching refurbishment projects from category ID 49')
    const posts = await getPostsByCategory(49, page, perPage)
    console.log(`📊 Found ${posts.length} refurbishment projects`)
    return posts
  } catch (error) {
    console.error('Error fetching refurbishment projects:', error)
    return []
  }
}

/**
 * Get religious architecture projects
 * Fetch posts from category ID 53 (Religious Architecture)
 */
export async function getReligiousProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('⛪ Fetching religious architecture projects from category ID 53')
    const posts = await getPostsByCategory(53, page, perPage)
    console.log(`📊 Found ${posts.length} religious architecture projects`)
    return posts
  } catch (error) {
    console.error('Error fetching religious architecture projects:', error)
    return []
  }
}

/**
 * Get residential architecture projects
 * Fetch posts from category ID 47 (Residential Architecture)
 */
export async function getResidentialProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🏡 Fetching residential architecture projects from category ID 47')
    const posts = await getPostsByCategory(47, page, perPage)
    console.log(`📊 Found ${posts.length} residential architecture projects`)
    return posts
  } catch (error) {
    console.error('Error fetching residential architecture projects:', error)
    return []
  }
}

/**
 * Get research and academic publications
 * Fetch posts from category ID 60 (Research)
 */
export async function getResearchPosts(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🔬 Fetching research posts from category ID 60')
    const posts = await getPostsByCategory(60, page, perPage)
    console.log(`📊 Found ${posts.length} research posts`)
    return posts
  } catch (error) {
    console.error('Error fetching research posts:', error)
    return []
  }
}

/**
 * Get student projects and academic work
 * Fetch posts from category ID 59 (Student Projects)
 */
export async function getStudentProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🎓 Fetching student projects from category ID 59')
    const posts = await getPostsByCategory(59, page, perPage)
    console.log(`📊 Found ${posts.length} student projects`)
    return posts
  } catch (error) {
    console.error('Error fetching student projects:', error)
    return []
  }
}

/**
 * Get all projects
 * Fetch posts from category ID 33 (Projects)
 */
export async function getAllProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('📁 Fetching all projects from category ID 33')
    const posts = await getPostsByCategory(33, page, perPage)
    console.log(`📊 Found ${posts.length} projects`)
    return posts
  } catch (error) {
    console.error('Error fetching all projects:', error)
    return []
  }
}

/**
 * Get academic posts
 * Fetch posts from category ID 58 (Academic)
 */
export async function getAcademicPosts(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('🎓 Fetching academic posts from category ID 58')
    const posts = await getPostsByCategory(58, page, perPage)
    console.log(`📊 Found ${posts.length} academic posts`)
    return posts
  } catch (error) {
    console.error('Error fetching academic posts:', error)
    return []
  }
}

/**
 * Get news posts
 * Fetch posts from category ID 42 (News)
 */
export async function getNewsPosts(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('📰 Fetching news posts from category ID 42')
    const posts = await getPostsByCategory(42, page, perPage)
    console.log(`📊 Found ${posts.length} news posts`)
    return posts
  } catch (error) {
    console.error('Error fetching news posts:', error)
    return []
  }
}

/**
 * Get articles posts
 * Fetch posts from category ID 41 (Articles)
 */
export async function getArticlesPosts(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    console.log('📚 Fetching articles posts from category ID 41')
    const posts = await getPostsByCategory(41, page, perPage)
    console.log(`📊 Found ${posts.length} articles posts`)
    return posts
  } catch (error) {
    console.error('Error fetching articles posts:', error)
    return []
  }
}
export async function searchPosts(searchTerm: string, page: number = 1, perPage: number = 10): Promise<WordPressPost[]> {
  try {
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&search=${encodeURIComponent(searchTerm)}&page=${page}&per_page=${perPage}&status=publish&orderby=relevance`,
      {
        next: { revalidate: 300 },
      }
    )
    
    if (!response.ok) {
      console.error(`WordPress API error for search "${searchTerm}": ${response.status} ${response.statusText}`)
      return []
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`WordPress API returned non-JSON response for search "${searchTerm}". Content-Type: ${contentType}, Preview: ${text.substring(0, 200)}`)
      return []
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
    const WORDPRESS_API_URL = getWordPressApiUrl()
    // URL encode the slug to handle special characters
    const encodedSlug = encodeURIComponent(slug)
    
    // Try the standard REST API endpoint first
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&slug=${encodedSlug}&status=publish&acf_format=standard`,
      {
        next: { revalidate: 300 },
      }
    )
    
    if (!response.ok) {
      console.error(`WordPress API error for slug "${slug}": ${response.status} ${response.statusText}`)
      return null
    }
    
    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`WordPress API returned non-JSON response for slug "${slug}": ${contentType}`)
      
      // Try alternative: fetch all posts and filter by slug (fallback)
      return await getProjectBySlugFallback(slug)
    }
    
    const posts: WordPressPost[] = await response.json()
    if (posts.length > 0) {
      return posts[0]
    }
    
    // If no results, try fallback method
    return await getProjectBySlugFallback(slug)
  } catch (error) {
    console.error(`Error fetching project by slug "${slug}":`, error)
    // Try fallback method
    return await getProjectBySlugFallback(slug)
  }
}

/**
 * Fallback method: Fetch recent posts and find by slug
 */
async function getProjectBySlugFallback(slug: string): Promise<WordPressPost | null> {
  try {
    const WORDPRESS_API_URL = getWordPressApiUrl()
    console.log(`Attempting fallback fetch for slug: "${slug}"`)
    
    // Fetch a larger batch of recent posts and search for the slug
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&per_page=100&status=publish&orderby=date&order=desc`,
      {
        next: { revalidate: 300 },
      }
    )
    
    if (!response.ok) {
      console.error(`Fallback fetch failed with status: ${response.status}`)
      return null
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Fallback fetch returned non-JSON: ${contentType}`)
      return null
    }
    
    const posts: WordPressPost[] = await response.json()
    console.log(`Fallback: Fetched ${posts.length} posts, searching for slug: "${slug}"`)
    
    // Try exact match first (case-insensitive)
    let post = posts.find(p => p.slug.toLowerCase() === slug.toLowerCase())
    
    // If not found, try partial match (in case slug has extra characters)
    if (!post) {
      post = posts.find(p => p.slug.toLowerCase().includes(slug.toLowerCase()) || slug.toLowerCase().includes(p.slug.toLowerCase()))
    }
    
    // If still not found, try matching against the link/permalink
    if (!post) {
      const normalizedSlug = slug.replace(/\/$/, '') // Remove trailing slash
      post = posts.find(p => {
        const linkSlug = p.link.split('/').filter(Boolean).pop()?.replace(/\/$/, '')
        return linkSlug?.toLowerCase() === normalizedSlug.toLowerCase()
      })
    }
    
    if (post) {
      console.log(`Fallback: Found post with slug "${post.slug}" (matched against "${slug}")`)
    } else {
      console.log(`Fallback: No post found matching slug "${slug}"`)
      // Log available slugs for debugging
      if (posts.length > 0) {
        console.log(`Available slugs (first 10): ${posts.slice(0, 10).map(p => p.slug).join(', ')}`)
      }
    }
    
    return post || null
  } catch (error) {
    console.error(`Error in fallback fetch for slug "${slug}":`, error)
    return null
  }
}

/**
 * Get posts by category with pagination for next/previous navigation
 */
export async function getPostsByCategoryPaginated(
  categoryId: number,
  perPage: number = 100
): Promise<WordPressPost[]> {
  try {
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&categories=${categoryId}&per_page=${perPage}&status=publish&orderby=date&order=desc`,
      {
        next: { revalidate: 300 },
      }
    )
    
    if (!response.ok) {
      console.error(`WordPress API error for category ${categoryId}: ${response.status} ${response.statusText}`)
      return []
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error(`WordPress API returned non-JSON response for category ${categoryId}. Content-Type: ${contentType}, Preview: ${text.substring(0, 200)}`)
      return []
    }
    
    const posts: WordPressPost[] = await response.json()
    return posts
  } catch (error) {
    console.error('Error fetching posts by category:', error)
    return []
  }
}

/**
 * Get media details by ID
 */
export async function getMediaUrl(mediaId: number): Promise<string | null> {
  try {
    const WORDPRESS_API_URL = getWordPressApiUrl()
    const response = await fetch(
      `${WORDPRESS_API_URL}/media/${mediaId}`,
      {
        next: { revalidate: 3600 },
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    const media = await response.json()
    return media.source_url || null
  } catch (error) {
    console.error('Error fetching media:', error)
    return null
  }
}