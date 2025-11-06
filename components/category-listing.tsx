import SiteLayout from "@/components/site-layout"
import CategoryGridClient from "@/components/category-grid-client"
import AdBannerComponent from "@/components/ad-banner"

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://archalley.com/wp-json/wp/v2'

interface CategoryListingProps {
  categoryId: number
  title: string
  basePath: string
  pageParam?: string | null
}

export default async function CategoryListing({ categoryId, title, basePath, pageParam }: CategoryListingProps) {
  const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
  const perPage = 10

  const url = `${WORDPRESS_API_URL}/posts?_embed=wp:featuredmedia,wp:term&categories=${categoryId}&page=${page}&per_page=${perPage}&status=publish&orderby=date&order=desc`
  
  console.log(`🔍 CategoryListing: Fetching posts for category ${categoryId} from ${url}`)
  
  let posts: any[] = []
  let totalPages = 1
  
  try {
    const response = await fetch(url, { 
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    
    console.log(`📊 CategoryListing: Response status ${response.status} for category ${categoryId}`)
    console.log(`📋 CategoryListing: Response URL: ${response.url}`)
    
    if (!response.ok) {
      console.error(`❌ CategoryListing: WordPress API error for category ${categoryId}: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`❌ CategoryListing: Error response preview: ${errorText.substring(0, 500)}`)
    } else {
      const contentType = response.headers.get('content-type') || ''
      console.log(`📋 CategoryListing: Content-Type: ${contentType} for category ${categoryId}`)
      
      if (contentType.includes('application/json')) {
        posts = await response.json()
        totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10)
        console.log(`✅ CategoryListing: Successfully fetched ${posts.length} posts for category ${categoryId} (${title}), Total pages: ${totalPages}`)
      } else {
        const text = await response.text()
        console.error(`❌ CategoryListing: WordPress API returned non-JSON response for category ${categoryId}. Content-Type: ${contentType}`)
        console.error(`❌ CategoryListing: Response URL: ${response.url}`)
        console.error(`❌ CategoryListing: Response preview (first 500 chars): ${text.substring(0, 500)}`)
        
        // Check if it's a login page or error page
        if (text.includes('login') || text.includes('Login')) {
          console.error(`⚠️ CategoryListing: WordPress appears to be requiring authentication or login`)
        }
        if (text.includes('403') || text.includes('Forbidden')) {
          console.error(`⚠️ CategoryListing: WordPress REST API may be blocked (403 Forbidden)`)
        }
        if (text.includes('404') || text.includes('Not Found')) {
          console.error(`⚠️ CategoryListing: WordPress REST API endpoint not found (404)`)
        }
        
        posts = []
        totalPages = 1
      }
    }
  } catch (error) {
    console.error(`❌ CategoryListing: Error fetching posts for category ${categoryId}:`, error)
    posts = []
    totalPages = 1
  }

  return (
    <>
      <SiteLayout>
        <div className="space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <CategoryGridClient posts={posts} currentPage={page} totalPages={totalPages} basePath={basePath} />
          <div className="mt-12">
            <AdBannerComponent size="970x180" className="w-full rounded-lg overflow-hidden" positionId="category-bottom-banner" autoRotate={true} rotationInterval={60} showLabel={false} />
          </div>
        </div>
      </SiteLayout>
    </>
  )
}


