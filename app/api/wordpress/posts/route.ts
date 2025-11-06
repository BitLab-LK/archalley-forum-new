import { NextResponse } from 'next/server'

/**
 * API endpoint to fetch latest WordPress posts for sidebar
 * Fetches 4 latest posts with featured images
 */
export async function GET() {
  try {
    const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://archalley.com/wp-json/wp/v2'
    
    // Try with status=publish first, then fallback without it
    const apiUrls = [
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia&per_page=4&orderby=date&order=desc&status=publish`,
      `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia&per_page=4&orderby=date&order=desc`,
    ]
    
    let lastError: Error | null = null
    
    for (const apiUrl of apiUrls) {
      try {
        console.log(`[WordPress API] Fetching posts from: ${apiUrl}`)
        
        const response = await fetch(apiUrl, {
          next: { revalidate: 300 }, // Revalidate every 5 minutes
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error(`[WordPress API] Error ${response.status} ${response.statusText}:`, errorText.substring(0, 200))
          
          // If first URL fails, try the next one
          if (apiUrl === apiUrls[0]) {
            lastError = new Error(`WordPress API error: ${response.status} ${response.statusText}`)
            continue
          }
          
          return NextResponse.json({ 
            posts: [],
            error: `WordPress API error: ${response.status} ${response.statusText}`,
            apiUrl 
          }, { status: 200 })
        }

        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const text = await response.text()
          console.error(`[WordPress API] Non-JSON response. Content-Type: ${contentType}, Preview:`, text.substring(0, 200))
          
          // If first URL fails, try the next one
          if (apiUrl === apiUrls[0]) {
            lastError = new Error(`Non-JSON response: ${contentType}`)
            continue
          }
          
          return NextResponse.json({ 
            posts: [],
            error: `WordPress API returned non-JSON response: ${contentType}`,
            apiUrl
          }, { status: 200 })
        }

        const posts = await response.json()
        console.log(`[WordPress API] Successfully fetched ${Array.isArray(posts) ? posts.length : 0} posts`)
        
        if (!Array.isArray(posts)) {
          console.error('[WordPress API] Response is not an array:', typeof posts)
          
          // If first URL fails, try the next one
          if (apiUrl === apiUrls[0]) {
            lastError = new Error('Invalid response format')
            continue
          }
          
          return NextResponse.json({ posts: [], error: 'Invalid response format', apiUrl }, { status: 200 })
        }
        
        // Success!
        return NextResponse.json({ posts: posts || [] })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[WordPress API] Exception with ${apiUrl}:`, errorMessage)
        lastError = error instanceof Error ? error : new Error(errorMessage)
        
        // If this was the first URL, try the next one
        if (apiUrl === apiUrls[0]) {
          continue
        }
      }
    }
    
    // If all URLs failed, return error
    const errorMessage = lastError instanceof Error ? lastError.message : 'All API attempts failed'
    console.error('[WordPress API] All attempts failed:', errorMessage)
    return NextResponse.json({ 
      posts: [],
      error: `Exception: ${errorMessage}`,
      apiUrl: WORDPRESS_API_URL
    }, { status: 200 })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[WordPress API] Outer exception:', errorMessage)
    return NextResponse.json({ 
      posts: [],
      error: `Exception: ${errorMessage}`,
      apiUrl: process.env.WORDPRESS_API_URL || 'https://archalley.com/wp-json/wp/v2'
    }, { status: 200 })
  }
}

