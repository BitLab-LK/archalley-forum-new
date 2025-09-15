// Simple script to check categories in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCategories() {
  try {
    console.log('🔍 Checking available categories...')
    
    const categories = await prisma.categories.findMany({
      select: { id: true, name: true, slug: true, postCount: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('📊 Available categories:')
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug}) - Posts: ${cat.postCount}`)
    })
    
    console.log(`\n✅ Total categories: ${categories.length}`)
    
  } catch (error) {
    console.error('❌ Error checking categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCategories()