import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentAds() {
  try {
    console.log('📊 Checking current advertisements...');
    
    const ads = await prisma.advertisement.findMany({
      select: {
        id: true,
        title: true,
        size: true,
        active: true,
        imageUrl: true,
        redirectUrl: true
      },
      orderBy: [
        { active: 'desc' },
        { size: 'asc' }
      ]
    });

    console.log(`\n📋 Found ${ads.length} total advertisements:\n`);
    
    // Group by size
    const adsBySize = ads.reduce((acc, ad) => {
      const size = ad.size;
      if (!acc[size]) acc[size] = [];
      acc[size].push(ad);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(adsBySize).forEach(([size, sizeAds]) => {
      console.log(`📐 Size ${size}:`);
      sizeAds.forEach((ad, index) => {
        const status = ad.active ? '✅ Active' : '❌ Inactive';
        console.log(`  ${index + 1}. ${ad.title} - ${status}`);
        console.log(`     Image: ${ad.imageUrl}`);
        console.log(`     URL: ${ad.redirectUrl}\n`);
      });
    });

    console.log('🔍 Quick Summary:');
    Object.entries(adsBySize).forEach(([size, sizeAds]) => {
      const active = sizeAds.filter(ad => ad.active).length;
      console.log(`  ${size}: ${active}/${sizeAds.length} active`);
    });

  } catch (error) {
    console.error('❌ Error checking ads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentAds();