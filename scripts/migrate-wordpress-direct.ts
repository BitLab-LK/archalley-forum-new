import { PrismaClient } from '@prisma/client'
import { AdPriority } from '@prisma/client'

const prisma = new PrismaClient()

// Based on your WordPress site structure
const wordpressAdsData = [
  // 680x180 ads (Medium Rectangle - Between Projects & Articles)
  {
    title: 'A-Brand Banner 680x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/A-Brand-Banner-680x180-1.webp',
    redirectUrl: 'https://abrand.com',
    size: '680x180',
    description: 'A-Brand premium products and services',
    priority: 'high',
    weight: 80
  },
  {
    title: 'Access Banner 680x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/Access-Banner-680x180-1.webp',
    redirectUrl: 'https://access.com',
    size: '680x180',
    description: 'Access solutions for your needs',
    priority: 'medium',
    weight: 70
  },
  {
    title: 'Noorbhoy Banner 680x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/Noorbhoy-Banner-680x180-1.webp',
    redirectUrl: 'https://noorbhoy.com',
    size: '680x180',
    description: 'Noorbhoy quality products',
    priority: 'medium',
    weight: 75
  },
  {
    title: 'BW Banner 680x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/BW-banner-680x180-1.webp',
    redirectUrl: 'https://bw.com',
    size: '680x180',
    description: 'BW professional services',
    priority: 'medium',
    weight: 65
  },
  {
    title: 'Crystal Banner 680x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/Crystal-banner-680x180-1.webp',
    redirectUrl: 'https://crystal.com',
    size: '680x180',
    description: 'Crystal clear solutions',
    priority: 'medium',
    weight: 60
  },

  // 350x350 ad (Square Sidebar - Fixed)
  {
    title: 'Exel Banner Square',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/02/Exel-Banner-345-x-345-main-banner.webp',
    redirectUrl: 'https://exel.com',
    size: '350x350',
    description: 'Exel design software - Fixed sidebar advertisement',
    priority: 'high',
    weight: 100
  },

  // 970x180 ads (Large Leaderboard - Multiple positions)
  {
    title: 'A-Brand Banner 970x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/A-Brand-Banner-970x180-1.webp',
    redirectUrl: 'https://abrand.com',
    size: '970x180',
    description: 'A-Brand premium products and services - Large banner',
    priority: 'high',
    weight: 90
  },
  {
    title: 'Access Banner 970x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/Access-Banner-970x180-1.webp',
    redirectUrl: 'https://access.com',
    size: '970x180',
    description: 'Access solutions - Large banner format',
    priority: 'high',
    weight: 85
  },
  {
    title: 'Noorbhoy Banner 970x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/Noorbhoy-Banner-970x180-1.webp',
    redirectUrl: 'https://noorbhoy.com',
    size: '970x180',
    description: 'Noorbhoy quality products - Large banner',
    priority: 'medium',
    weight: 80
  },
  {
    title: 'BW Banner 970x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/BW-banner-970x180-1.webp',
    redirectUrl: 'https://bw.com',
    size: '970x180',
    description: 'BW professional services - Large banner',
    priority: 'medium',
    weight: 75
  },
  {
    title: 'Crystal Banner 970x180',
    imageUrl: 'https://archalley.com/wp-content/uploads/2025/01/Crystal-banner-970x180-1.webp',
    redirectUrl: 'https://crystal.com',
    size: '970x180',
    description: 'Crystal clear solutions - Large banner format',
    priority: 'medium',
    weight: 70
  }
]

function mapPriorityToEnum(priority: string): AdPriority {
  switch (priority.toLowerCase()) {
    case 'high':
      return AdPriority.HIGH
    case 'low':
      return AdPriority.LOW
    default:
      return AdPriority.MEDIUM
  }
}

async function migrateWordPressAdsDirectly() {
  try {
    console.log('🚀 Starting WordPress ads migration (Direct Data)...')
    console.log(`📊 Found ${wordpressAdsData.length} WordPress ads to migrate`)
    
    let migratedCount = 0
    let skippedCount = 0
    let updatedCount = 0
    
    for (const wpAd of wordpressAdsData) {
      try {
        // Create unique ID for WordPress migration
        const migrationId = `wp-${wpAd.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        
        // Check if already exists
        const existing = await prisma.advertisement.findUnique({
          where: { id: migrationId }
        })
        
        const adData = {
          title: wpAd.title,
          description: wpAd.description,
          imageUrl: wpAd.imageUrl,
          redirectUrl: wpAd.redirectUrl,
          size: wpAd.size,
          active: true,
          weight: wpAd.weight,
          priority: mapPriorityToEnum(wpAd.priority),
          clickCount: 0,
          impressions: 0
        }
        
        if (existing) {
          // Update existing ad
          await prisma.advertisement.update({
            where: { id: migrationId },
            data: adData
          })
          console.log(`🔄 Updated: ${wpAd.title} (${wpAd.size})`)
          updatedCount++
        } else {
          // Create new advertisement
          await prisma.advertisement.create({
            data: {
              id: migrationId,
              ...adData
            }
          })
          console.log(`✅ Migrated: ${wpAd.title} (${wpAd.size})`)
          migratedCount++
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${wpAd.title}:`, error)
        skippedCount++
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migratedCount} new ads`)
    console.log(`🔄 Updated existing: ${updatedCount} ads`)
    console.log(`⚠️ Skipped: ${skippedCount} ads`)
    console.log(`📈 Total processed: ${wordpressAdsData.length} ads`)
    
    // Show final statistics by size
    const sizeStats = await prisma.advertisement.groupBy({
      by: ['size'],
      _count: {
        size: true
      },
      orderBy: {
        size: 'asc'
      }
    })
    
    console.log('\n📏 Ads by Size:')
    for (const stat of sizeStats) {
      console.log(`   ${stat.size}: ${stat._count.size} ads`)
    }
    
    // Final count
    const totalAds = await prisma.advertisement.count()
    console.log(`\n📈 Total ads in database: ${totalAds}`)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
if (require.main === module) {
  migrateWordPressAdsDirectly()
    .then(() => {
      console.log('🎉 WordPress ads migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export { migrateWordPressAdsDirectly }