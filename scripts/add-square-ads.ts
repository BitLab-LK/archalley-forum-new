import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSquareAds() {
  try {
    console.log('🎯 Adding 320x320 square ads for sidebar...')
    
    // Get the existing 350x350 ad
    const existingSquareAd = await prisma.advertisement.findFirst({
      where: { size: '350x350', active: true }
    })
    
    if (!existingSquareAd) {
      console.log('❌ No 350x350 ad found to convert')
      return
    }
    
    console.log(`📦 Found existing square ad: ${existingSquareAd.title}`)
    
    // Create a 320x320 version of the same ad
    const newSquareAd = await prisma.advertisement.create({
      data: {
        id: `${existingSquareAd.id}-320x320`,
        title: `${existingSquareAd.title} (320x320)`,
        description: existingSquareAd.description,
        imageUrl: existingSquareAd.imageUrl, // Same image, will be resized by browser
        redirectUrl: existingSquareAd.redirectUrl,
        size: '320x320',
        active: true,
        weight: existingSquareAd.weight,
        priority: existingSquareAd.priority,
        clickCount: 0,
        impressions: 0,
        // Don't set createdBy to avoid foreign key constraint issues
      }
    })
    
    console.log(`✅ Created new 320x320 ad: ${newSquareAd.title}`)
    
    // Add a few more square ads by duplicating existing horizontal ads
    const horizontalAds = await prisma.advertisement.findMany({
      where: { 
        size: { in: ['680x180', '970x180'] },
        active: true 
      },
      take: 3 // Get 3 horizontal ads to convert
    })
    
    for (const horizontalAd of horizontalAds) {
      const squareAdId = `${horizontalAd.id}-square-320`
      
      // Check if this square version already exists
      const existing = await prisma.advertisement.findUnique({
        where: { id: squareAdId }
      })
      
      if (!existing) {
        await prisma.advertisement.create({
          data: {
            id: squareAdId,
            title: `${horizontalAd.title} Square`,
            description: horizontalAd.description,
            imageUrl: horizontalAd.imageUrl, // Same image, different aspect ratio
            redirectUrl: horizontalAd.redirectUrl,
            size: '320x320',
            active: true,
            weight: Math.max(horizontalAd.weight - 10, 50), // Slightly lower weight
            priority: horizontalAd.priority,
            clickCount: 0,
            impressions: 0,
            // Don't set createdBy to avoid foreign key constraint issues
          }
        })
        
        console.log(`✅ Created square version of: ${horizontalAd.title}`)
      }
    }
    
    // Check final count
    const squareCount = await prisma.advertisement.count({
      where: { size: '320x320', active: true }
    })
    
    console.log(`\n📊 Total 320x320 square ads: ${squareCount}`)
    
  } catch (error) {
    console.error('❌ Error adding square ads:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSquareAds()