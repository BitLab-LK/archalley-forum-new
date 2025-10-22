import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test the ads API logic similar to what's in the API route
async function testAdsAPI() {
  try {
    console.log('🧪 Testing ads API logic...\n');
    
    // Test different sizes
    const sizesToTest = ['320x320', '350x350', '680x180', '970x180'];
    
    for (const size of sizesToTest) {
      console.log(`📐 Testing size: ${size}`);
      
      // Get all ads for this size
      const ads = await prisma.advertisement.findMany({
        where: { 
          size,
          active: true 
        },
        select: {
          id: true,
          title: true,
          size: true,
          imageUrl: true,
          redirectUrl: true,
          weight: true,
          priority: true
        }
      });
      
      console.log(`  Found ${ads.length} active ads:`);
      ads.forEach((ad, index) => {
        console.log(`    ${index + 1}. ${ad.title} (weight: ${ad.weight}, priority: ${ad.priority})`);
      });
      
      // Test weighted selection
      if (ads.length > 0) {
        const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight || 1), 0);
        const randomValue = Math.random() * totalWeight;
        let weightSum = 0;
        let selectedAd = null;
        
        for (const ad of ads) {
          weightSum += ad.weight || 1;
          if (randomValue <= weightSum) {
            selectedAd = ad;
            break;
          }
        }
        
        if (selectedAd) {
          console.log(`    ✅ Selected: ${selectedAd.title}`);
        }
      } else {
        console.log(`    ❌ No ads found for size ${size}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error testing ads API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdsAPI();