import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAds() {
  try {
    console.log('🔍 Checking advertisements in database...')
    
    const ads = await prisma.advertisement.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        size: true,
        imageUrl: true,
        redirectUrl: true,
        active: true,
        priority: true,
        weight: true,
        clickCount: true,
        impressions: true
      },
      orderBy: { size: 'asc' }
    })
    
    console.log(`\n📊 Found ${ads.length} active advertisements:\n`)
    
    // Group by size
    const adsBySize = ads.reduce((acc, ad) => {
      if (!acc[ad.size]) acc[ad.size] = []
      acc[ad.size].push(ad)
      return acc
    }, {} as Record<string, any[]>)
    
    for (const [size, sizeAds] of Object.entries(adsBySize)) {
      console.log(`\n📐 Size: ${size} (${sizeAds.length} ads)`)
      sizeAds.forEach(ad => {
        console.log(`  ├─ ID: ${ad.id}`)
        console.log(`  ├─ Title: ${ad.title || 'No title'}`)
        console.log(`  ├─ Image: ${ad.imageUrl}`)
        console.log(`  ├─ Priority: ${ad.priority}`)
        console.log(`  ├─ Weight: ${ad.weight}`)
        console.log(`  ├─ Clicks: ${ad.clickCount}`)
        console.log(`  └─ Impressions: ${ad.impressions}\n`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking ads:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAds()
