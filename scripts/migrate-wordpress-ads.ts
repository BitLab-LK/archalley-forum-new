import { PrismaClient } from '@prisma/client'
import { AdPriority } from '@prisma/client'

const prisma = new PrismaClient()

// WordPress API configuration
const WORDPRESS_API_BASE = process.env.WORDPRESS_API_URL || 'https://archalley.com/wp-json/wp/v2'

interface WordPressAd {
  id: number
  title: { rendered: string }
  content?: { rendered: string }
  excerpt?: { rendered: string }
  link?: string
  status: string
  featured_media_url?: string
  categories?: number[]
  tags?: number[]
  acf?: {
    ad_size?: string
    ad_image?: { url: string } | string
    ad_link?: string
    ad_title?: string
    ad_description?: string
    ad_weight?: string
    ad_priority?: string
  }
  meta?: {
    ad_size?: string
    ad_link?: string
    ad_weight?: string
    ad_priority?: string
  }
}

async function fetchAllWordPressAds(): Promise<WordPressAd[]> {
  try {
    console.log('🔍 Fetching WordPress advertisements...')
    
    // Try multiple possible endpoints for WordPress ads
    const possibleEndpoints = [
      '/advertisements',
      '/posts?category_name=advertisement',
      '/posts?category_name=ads',
      '/posts?tag=advertisement',
      '/posts?tag=ads',
      '/posts?categories=advertisement',
      '/ad',
      '/ads'
    ]
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`)
        const response = await fetch(`${WORDPRESS_API_BASE}${endpoint}?per_page=100&status=publish`, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            console.log(`✅ Found ${data.length} WordPress ads from ${endpoint}`)
            return data
          }
        }
      } catch (error) {
        console.log(`⚠️ Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    // If no custom endpoints work, try to get all posts and filter for ads
    console.log('🔍 Trying to fetch all posts and filter for advertisements...')
    const response = await fetch(`${WORDPRESS_API_BASE}/posts?per_page=100&status=publish`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      const allPosts = await response.json()
      // Filter posts that might be advertisements
      const adPosts = allPosts.filter((post: any) => {
        const title = post.title?.rendered?.toLowerCase() || ''
        const content = post.content?.rendered?.toLowerCase() || ''
        const categories = post.categories || []
        const tags = post.tags || []
        
        // Look for ad-related keywords
        return title.includes('ad') || title.includes('advertisement') || 
               content.includes('advertisement') || content.includes('sponsor') ||
               categories.some((cat: any) => String(cat).includes('ad')) ||
               tags.some((tag: any) => String(tag).includes('ad'))
      })
      
      if (adPosts.length > 0) {
        console.log(`✅ Found ${adPosts.length} potential advertisement posts`)
        return adPosts
      }
    }
    
    console.log('❌ No advertisements found in WordPress')
    return []
  } catch (error) {
    console.error('❌ Error fetching WordPress ads:', error)
    return []
  }
}

function mapPriorityToEnum(priority: string | undefined): AdPriority {
  if (!priority) return AdPriority.MEDIUM
  
  switch (priority.toLowerCase()) {
    case 'high':
      return AdPriority.HIGH
    case 'low':
      return AdPriority.LOW
    default:
      return AdPriority.MEDIUM
  }
}

async function migrateWordPressAdsToDatabase() {
  try {
    console.log('🚀 Starting WordPress ads migration...')
    
    // Fetch all WordPress ads
    const wpAds = await fetchAllWordPressAds()
    
    if (wpAds.length === 0) {
      console.log('⚠️ No WordPress ads found to migrate')
      return
    }
    
    let migratedCount = 0
    let skippedCount = 0
    
    for (const wpAd of wpAds) {
      try {
        // Extract ad data with multiple fallback strategies
        let imageUrl = ''
        
        // Try ACF fields first
        if (wpAd.acf?.ad_image) {
          imageUrl = typeof wpAd.acf.ad_image === 'object' ? wpAd.acf.ad_image?.url : wpAd.acf.ad_image
        }
        
        // Try featured media
        if (!imageUrl && wpAd.featured_media_url) {
          imageUrl = wpAd.featured_media_url
        }
        
        // Try to extract image from content
        if (!imageUrl && wpAd.content?.rendered) {
          const imgMatch = wpAd.content.rendered.match(/<img[^>]+src="([^">]+)"/i)
          if (imgMatch) {
            imageUrl = imgMatch[1]
          }
        }
        
        // Extract other data
        const redirectUrl = wpAd.acf?.ad_link || wpAd.meta?.ad_link || wpAd.link || '#'
        const size = wpAd.acf?.ad_size || wpAd.meta?.ad_size || 
                    (imageUrl.includes('320') || imageUrl.includes('square') ? '320x320' : '970x180')
        const title = wpAd.acf?.ad_title || wpAd.title?.rendered || 'Migrated Advertisement'
        const description = wpAd.acf?.ad_description || wpAd.excerpt?.rendered || 
                           wpAd.content?.rendered?.replace(/<[^>]*>/g, '').substring(0, 200) || ''
        const weight = parseInt(wpAd.acf?.ad_weight || wpAd.meta?.ad_weight || '50')
        const priority = mapPriorityToEnum(wpAd.acf?.ad_priority || wpAd.meta?.ad_priority)
        
        // Skip if essential data is missing
        if (!imageUrl || !redirectUrl || redirectUrl === '#') {
          console.log(`⚠️ Skipping WordPress ad ${wpAd.id} - missing essential data`)
          skippedCount++
          continue
        }
        
        // Create unique ID for WordPress migration
        const migrationId = `wp-migrated-${wpAd.id}`
        
        // Check if already exists
        const existing = await prisma.advertisement.findUnique({
          where: { id: migrationId }
        })
        
        if (existing) {
          console.log(`⚠️ Skipping WordPress ad ${wpAd.id} - already migrated`)
          skippedCount++
          continue
        }
        
        // Create advertisement in database
        await prisma.advertisement.create({
          data: {
            id: migrationId,
            title: title.substring(0, 255), // Ensure length limits
            description: description.substring(0, 500),
            imageUrl,
            redirectUrl,
            size,
            active: wpAd.status === 'publish',
            weight: Math.min(Math.max(weight, 1), 100), // Clamp between 1-100
            priority,
            clickCount: 0,
            impressions: 0,
            // Note: createdBy will be null for migrated ads
          }
        })
        
        console.log(`✅ Migrated WordPress ad ${wpAd.id}: ${title}`)
        migratedCount++
        
      } catch (error) {
        console.error(`❌ Error migrating WordPress ad ${wpAd.id}:`, error)
        skippedCount++
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migratedCount} ads`)
    console.log(`⚠️ Skipped: ${skippedCount} ads`)
    console.log(`🎯 Total processed: ${wpAds.length} ads`)
    
    // Verify migration
    const totalAds = await prisma.advertisement.count()
    console.log(`\n📈 Total ads in database: ${totalAds}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
if (require.main === module) {
  migrateWordPressAdsToDatabase()
    .then(() => {
      console.log('🎉 Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export { migrateWordPressAdsToDatabase }