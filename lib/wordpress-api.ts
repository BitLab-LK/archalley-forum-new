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
 * Get hospitality architecture projects
 * This function specifically looks for projects related to hotels, resorts, and hospitality venues
 */
export async function getHospitalityProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find hospitality category first
    const categories = await getAllCategories()
    const hospitalityCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('hospitality') || 
      cat.slug.toLowerCase().includes('hotel') ||
      cat.slug.toLowerCase().includes('resort') ||
      cat.name.toLowerCase().includes('hospitality') ||
      cat.name.toLowerCase().includes('hotel') ||
      cat.name.toLowerCase().includes('resort')
    )
    
    // If we found a hospitality category, fetch posts from that category
    if (hospitalityCategory) {
      console.log(`✅ Found hospitality category: ${hospitalityCategory.name} (ID: ${hospitalityCategory.id})`)
      const posts = await getPostsByCategory(hospitalityCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No hospitality category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to hospitality based on title and content
    const hospitalityPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('hotel') ||
        title.includes('hospitality') ||
        title.includes('resort') ||
        title.includes('restaurant') ||
        title.includes('café') ||
        title.includes('cafe') ||
        title.includes('bar') ||
        title.includes('lounge') ||
        title.includes('spa') ||
        excerpt.includes('hotel') ||
        excerpt.includes('hospitality') ||
        excerpt.includes('resort') ||
        excerpt.includes('restaurant') ||
        excerpt.includes('guest') ||
        content.includes('hospitality') ||
        content.includes('hotel design') ||
        content.includes('resort architecture') ||
        content.includes('guest experience')
      )
    })
    
    console.log(`📊 Found ${hospitalityPosts.length} hospitality projects from ${posts.length} total posts`)
    return hospitalityPosts
    
  } catch (error) {
    console.error('Error fetching hospitality projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get industrial and infrastructure projects
 * This function specifically looks for projects related to industrial buildings and infrastructure
 */
export async function getIndustrialProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find industrial/infrastructure category first
    const categories = await getAllCategories()
    const industrialCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('industrial') || 
      cat.slug.toLowerCase().includes('infrastructure') ||
      cat.slug.toLowerCase().includes('factory') ||
      cat.name.toLowerCase().includes('industrial') ||
      cat.name.toLowerCase().includes('infrastructure') ||
      cat.name.toLowerCase().includes('factory')
    )
    
    // If we found an industrial category, fetch posts from that category
    if (industrialCategory) {
      console.log(`✅ Found industrial category: ${industrialCategory.name} (ID: ${industrialCategory.id})`)
      const posts = await getPostsByCategory(industrialCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No industrial category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to industrial/infrastructure based on title and content
    const industrialPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('industrial') ||
        title.includes('infrastructure') ||
        title.includes('factory') ||
        title.includes('warehouse') ||
        title.includes('manufacturing') ||
        title.includes('plant') ||
        title.includes('facility') ||
        title.includes('logistics') ||
        title.includes('distribution') ||
        excerpt.includes('industrial') ||
        excerpt.includes('infrastructure') ||
        excerpt.includes('factory') ||
        excerpt.includes('warehouse') ||
        excerpt.includes('manufacturing') ||
        content.includes('industrial building') ||
        content.includes('infrastructure project') ||
        content.includes('manufacturing facility') ||
        content.includes('logistics center')
      )
    })
    
    console.log(`📊 Found ${industrialPosts.length} industrial projects from ${posts.length} total posts`)
    return industrialPosts
    
  } catch (error) {
    console.error('Error fetching industrial projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get interior design projects
 * This function specifically looks for projects related to interior design and spaces
 */
export async function getInteriorProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find interior design category first
    const categories = await getAllCategories()
    const interiorCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('interior') || 
      cat.slug.toLowerCase().includes('design') ||
      cat.name.toLowerCase().includes('interior') ||
      cat.name.toLowerCase().includes('interior design')
    )
    
    // If we found an interior category, fetch posts from that category
    if (interiorCategory) {
      console.log(`✅ Found interior category: ${interiorCategory.name} (ID: ${interiorCategory.id})`)
      const posts = await getPostsByCategory(interiorCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No interior category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to interior design based on title and content
    const interiorPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('interior') ||
        title.includes('interior design') ||
        title.includes('furniture') ||
        title.includes('décor') ||
        title.includes('decor') ||
        title.includes('living room') ||
        title.includes('bedroom') ||
        title.includes('kitchen') ||
        title.includes('bathroom') ||
        excerpt.includes('interior') ||
        excerpt.includes('interior design') ||
        excerpt.includes('furniture') ||
        excerpt.includes('décor') ||
        excerpt.includes('decor') ||
        excerpt.includes('living space') ||
        content.includes('interior design') ||
        content.includes('interior space') ||
        content.includes('interior architecture') ||
        content.includes('spatial design')
      )
    })
    
    console.log(`📊 Found ${interiorPosts.length} interior design projects from ${posts.length} total posts`)
    return interiorPosts
    
  } catch (error) {
    console.error('Error fetching interior design projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get landscape and urbanism projects
 * This function specifically looks for projects related to landscape architecture and urban planning
 */
export async function getLandscapeProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find landscape/urbanism category first
    const categories = await getAllCategories()
    const landscapeCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('landscape') || 
      cat.slug.toLowerCase().includes('urbanism') ||
      cat.slug.toLowerCase().includes('urban') ||
      cat.name.toLowerCase().includes('landscape') ||
      cat.name.toLowerCase().includes('urbanism') ||
      cat.name.toLowerCase().includes('urban planning')
    )
    
    // If we found a landscape category, fetch posts from that category
    if (landscapeCategory) {
      console.log(`✅ Found landscape category: ${landscapeCategory.name} (ID: ${landscapeCategory.id})`)
      const posts = await getPostsByCategory(landscapeCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No landscape category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to landscape/urbanism based on title and content
    const landscapePosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('landscape') ||
        title.includes('urbanism') ||
        title.includes('urban') ||
        title.includes('garden') ||
        title.includes('park') ||
        title.includes('plaza') ||
        title.includes('outdoor') ||
        title.includes('streetscape') ||
        title.includes('public space') ||
        excerpt.includes('landscape') ||
        excerpt.includes('urbanism') ||
        excerpt.includes('urban planning') ||
        excerpt.includes('urban design') ||
        excerpt.includes('garden') ||
        excerpt.includes('park') ||
        content.includes('landscape architecture') ||
        content.includes('urban planning') ||
        content.includes('urban design') ||
        content.includes('public space') ||
        content.includes('streetscape')
      )
    })
    
    console.log(`📊 Found ${landscapePosts.length} landscape projects from ${posts.length} total posts`)
    return landscapePosts
    
  } catch (error) {
    console.error('Error fetching landscape projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get public architecture projects
 * This function specifically looks for projects related to public buildings and civic structures
 */
export async function getPublicProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find public architecture category first
    const categories = await getAllCategories()
    const publicCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('public') || 
      cat.slug.toLowerCase().includes('civic') ||
      cat.slug.toLowerCase().includes('government') ||
      cat.name.toLowerCase().includes('public') ||
      cat.name.toLowerCase().includes('civic') ||
      cat.name.toLowerCase().includes('public architecture')
    )
    
    // If we found a public category, fetch posts from that category
    if (publicCategory) {
      console.log(`✅ Found public category: ${publicCategory.name} (ID: ${publicCategory.id})`)
      const posts = await getPostsByCategory(publicCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No public category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to public architecture based on title and content
    const publicPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('public') ||
        title.includes('civic') ||
        title.includes('government') ||
        title.includes('municipal') ||
        title.includes('library') ||
        title.includes('museum') ||
        title.includes('community center') ||
        title.includes('town hall') ||
        title.includes('cultural center') ||
        excerpt.includes('public') ||
        excerpt.includes('civic') ||
        excerpt.includes('government') ||
        excerpt.includes('municipal') ||
        excerpt.includes('library') ||
        excerpt.includes('museum') ||
        content.includes('public architecture') ||
        content.includes('civic building') ||
        content.includes('government building') ||
        content.includes('public facility') ||
        content.includes('community center')
      )
    })
    
    console.log(`📊 Found ${publicPosts.length} public architecture projects from ${posts.length} total posts`)
    return publicPosts
    
  } catch (error) {
    console.error('Error fetching public architecture projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get refurbishment projects
 * This function specifically looks for projects related to renovation and refurbishment
 */
export async function getRefurbishmentProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find refurbishment category first
    const categories = await getAllCategories()
    const refurbishmentCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('refurbishment') || 
      cat.slug.toLowerCase().includes('renovation') ||
      cat.slug.toLowerCase().includes('restoration') ||
      cat.name.toLowerCase().includes('refurbishment') ||
      cat.name.toLowerCase().includes('renovation') ||
      cat.name.toLowerCase().includes('restoration')
    )
    
    // If we found a refurbishment category, fetch posts from that category
    if (refurbishmentCategory) {
      console.log(`✅ Found refurbishment category: ${refurbishmentCategory.name} (ID: ${refurbishmentCategory.id})`)
      const posts = await getPostsByCategory(refurbishmentCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No refurbishment category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to refurbishment based on title and content
    const refurbishmentPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('refurbishment') ||
        title.includes('renovation') ||
        title.includes('restoration') ||
        title.includes('remodel') ||
        title.includes('retrofit') ||
        title.includes('adaptive reuse') ||
        title.includes('conversion') ||
        title.includes('modernization') ||
        title.includes('upgrade') ||
        excerpt.includes('refurbishment') ||
        excerpt.includes('renovation') ||
        excerpt.includes('restoration') ||
        excerpt.includes('remodel') ||
        excerpt.includes('retrofit') ||
        excerpt.includes('adaptive reuse') ||
        content.includes('refurbishment') ||
        content.includes('renovation project') ||
        content.includes('restoration project') ||
        content.includes('adaptive reuse') ||
        content.includes('building renovation')
      )
    })
    
    console.log(`📊 Found ${refurbishmentPosts.length} refurbishment projects from ${posts.length} total posts`)
    return refurbishmentPosts
    
  } catch (error) {
    console.error('Error fetching refurbishment projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get religious architecture projects
 * This function specifically looks for projects related to religious buildings and sacred spaces
 */
export async function getReligiousProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find religious architecture category first
    const categories = await getAllCategories()
    const religiousCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('religious') || 
      cat.slug.toLowerCase().includes('sacred') ||
      cat.slug.toLowerCase().includes('worship') ||
      cat.slug.toLowerCase().includes('church') ||
      cat.name.toLowerCase().includes('religious') ||
      cat.name.toLowerCase().includes('sacred') ||
      cat.name.toLowerCase().includes('religious architecture')
    )
    
    // If we found a religious category, fetch posts from that category
    if (religiousCategory) {
      console.log(`✅ Found religious category: ${religiousCategory.name} (ID: ${religiousCategory.id})`)
      const posts = await getPostsByCategory(religiousCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No religious category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to religious architecture based on title and content
    const religiousPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('religious') ||
        title.includes('church') ||
        title.includes('temple') ||
        title.includes('mosque') ||
        title.includes('synagogue') ||
        title.includes('chapel') ||
        title.includes('cathedral') ||
        title.includes('shrine') ||
        title.includes('monastery') ||
        title.includes('sacred') ||
        title.includes('worship') ||
        excerpt.includes('religious') ||
        excerpt.includes('church') ||
        excerpt.includes('temple') ||
        excerpt.includes('mosque') ||
        excerpt.includes('worship') ||
        excerpt.includes('sacred') ||
        content.includes('religious architecture') ||
        content.includes('sacred space') ||
        content.includes('place of worship') ||
        content.includes('religious building') ||
        content.includes('worship space')
      )
    })
    
    console.log(`📊 Found ${religiousPosts.length} religious architecture projects from ${posts.length} total posts`)
    return religiousPosts
    
  } catch (error) {
    console.error('Error fetching religious architecture projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get residential architecture projects
 * This function specifically looks for projects related to residential buildings and homes
 */
export async function getResidentialProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find residential architecture category first
    const categories = await getAllCategories()
    const residentialCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('residential') || 
      cat.slug.toLowerCase().includes('housing') ||
      cat.slug.toLowerCase().includes('home') ||
      cat.slug.toLowerCase().includes('villa') ||
      cat.name.toLowerCase().includes('residential') ||
      cat.name.toLowerCase().includes('housing') ||
      cat.name.toLowerCase().includes('residential architecture')
    )
    
    // If we found a residential category, fetch posts from that category
    if (residentialCategory) {
      console.log(`✅ Found residential category: ${residentialCategory.name} (ID: ${residentialCategory.id})`)
      const posts = await getPostsByCategory(residentialCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No residential category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to residential architecture based on title and content
    const residentialPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('residential') ||
        title.includes('house') ||
        title.includes('home') ||
        title.includes('villa') ||
        title.includes('apartment') ||
        title.includes('residence') ||
        title.includes('housing') ||
        title.includes('dwelling') ||
        title.includes('condominium') ||
        title.includes('townhouse') ||
        excerpt.includes('residential') ||
        excerpt.includes('house') ||
        excerpt.includes('home') ||
        excerpt.includes('villa') ||
        excerpt.includes('apartment') ||
        excerpt.includes('residence') ||
        content.includes('residential architecture') ||
        content.includes('residential project') ||
        content.includes('housing design') ||
        content.includes('home design') ||
        content.includes('residential building')
      )
    })
    
    console.log(`📊 Found ${residentialPosts.length} residential architecture projects from ${posts.length} total posts`)
    return residentialPosts
    
  } catch (error) {
    console.error('Error fetching residential architecture projects:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get research and academic publications
 * This function specifically looks for research papers, publications, and academic content
 */
export async function getResearchPosts(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find research/academic category first
    const categories = await getAllCategories()
    const researchCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('research') || 
      cat.slug.toLowerCase().includes('academic') ||
      cat.slug.toLowerCase().includes('publication') ||
      cat.slug.toLowerCase().includes('paper') ||
      cat.name.toLowerCase().includes('research') ||
      cat.name.toLowerCase().includes('academic') ||
      cat.name.toLowerCase().includes('publication')
    )
    
    // If we found a research category, fetch posts from that category
    if (researchCategory) {
      console.log(`✅ Found research category: ${researchCategory.name} (ID: ${researchCategory.id})`)
      const posts = await getPostsByCategory(researchCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No research category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to research and academic content
    const researchPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('research') ||
        title.includes('academic') ||
        title.includes('publication') ||
        title.includes('paper') ||
        title.includes('study') ||
        title.includes('thesis') ||
        title.includes('journal') ||
        title.includes('conference') ||
        title.includes('dissertation') ||
        excerpt.includes('research') ||
        excerpt.includes('academic') ||
        excerpt.includes('publication') ||
        excerpt.includes('study') ||
        excerpt.includes('paper') ||
        content.includes('research project') ||
        content.includes('academic research') ||
        content.includes('research paper') ||
        content.includes('scientific study') ||
        content.includes('academic publication')
      )
    })
    
    console.log(`📊 Found ${researchPosts.length} research posts from ${posts.length} total posts`)
    return researchPosts
    
  } catch (error) {
    console.error('Error fetching research posts:', error)
    // Return empty array on error, client will use fallback data
    return []
  }
}

/**
 * Get student projects and academic work
 * This function specifically looks for student projects, coursework, and academic portfolios
 */
export async function getStudentProjects(page: number = 1, perPage: number = 20): Promise<WordPressPost[]> {
  try {
    // Try to find student projects category first
    const categories = await getAllCategories()
    const studentCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('student') || 
      cat.slug.toLowerCase().includes('coursework') ||
      cat.slug.toLowerCase().includes('portfolio') ||
      cat.slug.toLowerCase().includes('academic-project') ||
      cat.name.toLowerCase().includes('student') ||
      cat.name.toLowerCase().includes('student project') ||
      cat.name.toLowerCase().includes('coursework')
    )
    
    // If we found a student projects category, fetch posts from that category
    if (studentCategory) {
      console.log(`✅ Found student projects category: ${studentCategory.name} (ID: ${studentCategory.id})`)
      const posts = await getPostsByCategory(studentCategory.id, page, perPage)
      if (posts.length > 0) {
        return posts
      }
    }
    
    // Fallback: get all posts and filter by keywords
    console.log('⚠️ No student projects category found, filtering all posts by keywords')
    const posts = await getAllPosts(page, perPage)
    
    // Filter posts that are related to student projects and academic work
    const studentPosts = posts.filter(post => {
      const title = post.title.rendered.toLowerCase()
      const excerpt = stripHtml(post.excerpt.rendered).toLowerCase()
      const content = stripHtml(post.content.rendered).toLowerCase()
      
      return (
        title.includes('student') ||
        title.includes('coursework') ||
        title.includes('portfolio') ||
        title.includes('academic project') ||
        title.includes('thesis project') ||
        title.includes('capstone') ||
        title.includes('semester project') ||
        title.includes('final year') ||
        excerpt.includes('student') ||
        excerpt.includes('coursework') ||
        excerpt.includes('academic project') ||
        excerpt.includes('student work') ||
        content.includes('student project') ||
        content.includes('academic portfolio') ||
        content.includes('student work') ||
        content.includes('coursework') ||
        content.includes('thesis project')
      )
    })
    
    console.log(`📊 Found ${studentPosts.length} student projects from ${posts.length} total posts`)
    return studentPosts
    
  } catch (error) {
    console.error('Error fetching student projects:', error)
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