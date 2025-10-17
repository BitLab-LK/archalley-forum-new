import { AdvertisementService } from '../lib/advertisement-service'
import { initialAdConfigs } from '../lib/adConfig'

/**
 * Seed the database with existing advertisement configurations
 */
export async function seedAds() {
  try {
    console.log('🎯 Starting advertisement seeding...')
    
    await AdvertisementService.seedAds(initialAdConfigs)
    
    const stats = await AdvertisementService.getAdStats()
    console.log('✅ Advertisement seeding completed!')
    console.log(`   - Total ads: ${stats.totalBanners}`)
    console.log(`   - Active ads: ${stats.activeBanners}`)
    console.log(`   - Available sizes: ${stats.availableSizes}`)
    
  } catch (error) {
    console.error('❌ Error seeding advertisements:', error)
    throw error
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedAds()
    .then(() => {
      console.log('Advertisement seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Advertisement seeding failed:', error)
      process.exit(1)
    })
}