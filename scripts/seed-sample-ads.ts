import { PrismaClient } from '@prisma/client'
import { AdPriority } from '@prisma/client'
import { initialAdConfigs } from '../lib/adConfig'

const prisma = new PrismaClient()

async function seedSampleAds() {
  try {
    console.log('🌱 Seeding sample advertisements to database...')
    
    // Check existing ads
    const existingCount = await prisma.advertisement.count()
    console.log(`📊 Current ads in database: ${existingCount}`)
    
    let seededCount = 0
    let skippedCount = 0
    
    for (const sampleAd of initialAdConfigs) {
      try {
        // Create database ID for sample ads
        const dbId = `db-${sampleAd.id}`
        
        // Check if already exists
        const existing = await prisma.advertisement.findUnique({
          where: { id: dbId }
        })
        
        if (existing) {
          console.log(`⚠️ Skipping ${sampleAd.id} - already exists as ${dbId}`)
          skippedCount++
          continue
        }
        
        // Map priority to enum
        let priority: AdPriority = AdPriority.MEDIUM
        if (sampleAd.priority === 'high') priority = AdPriority.HIGH
        if (sampleAd.priority === 'low') priority = AdPriority.LOW
        
        // Create advertisement
        await prisma.advertisement.create({
          data: {
            id: dbId,
            title: sampleAd.title || 'Sample Advertisement',
            description: sampleAd.description || 'Sample ad description',
            imageUrl: sampleAd.imageUrl,
            redirectUrl: sampleAd.redirectUrl,
            size: sampleAd.size,
            active: sampleAd.active,
            weight: sampleAd.weight || 50,
            priority,
            clickCount: sampleAd.clickCount || 0,
            impressions: 0
          }
        })
        
        console.log(`✅ Seeded: ${sampleAd.title || sampleAd.id} (${sampleAd.size})`)
        seededCount++
        
      } catch (error) {
        console.error(`❌ Error seeding ${sampleAd.id}:`, error)
        skippedCount++
      }
    }
    
    console.log('\n📊 Seeding Summary:')
    console.log(`✅ Successfully seeded: ${seededCount} ads`)
    console.log(`⚠️ Skipped: ${skippedCount} ads`)
    
    // Final count
    const finalCount = await prisma.advertisement.count()
    console.log(`📈 Total ads in database: ${finalCount}`)
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seeding
if (require.main === module) {
  seedSampleAds()
    .then(() => {
      console.log('🎉 Sample ads seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

export { seedSampleAds }