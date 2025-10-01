// Quick test to verify Prisma client types are working
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPrismaTypes() {
  try {
    console.log('🔍 Testing Prisma client types...')
    
    // Test PostCategory junction table access
    const junctionCount = await prisma.postCategory.count()
    console.log(`✅ PostCategory table accessible: ${junctionCount} entries`)
    
    // Test primaryCategoryId field
    const postsWithPrimary = await prisma.post.count({
      where: { primaryCategoryId: { not: null } }
    })
    console.log(`✅ primaryCategoryId field accessible: ${postsWithPrimary} posts`)
    
    // Test aiSuggestions field
    const samplePost = await prisma.post.findFirst({
      select: {
        id: true,
        primaryCategoryId: true,
        aiSuggestions: true,
        categoryIds: true
      }
    })
    
    if (samplePost) {
      console.log('✅ New fields accessible:')
      console.log(`   Primary category: ${samplePost.primaryCategoryId}`)
      console.log(`   AI suggestions: ${samplePost.aiSuggestions ? 'Available' : 'None'}`)
      console.log(`   Category IDs: [${samplePost.categoryIds.join(', ')}]`)
    }
    
    // Test relations
    const postWithRelations = await prisma.post.findFirst({
      include: {
        postCategories: true,
        primaryCategory: true
      }
    })
    
    if (postWithRelations) {
      console.log('✅ Relations accessible:')
      console.log(`   PostCategories: ${postWithRelations.postCategories.length} entries`)
      console.log(`   Primary category: ${postWithRelations.primaryCategory?.name || 'None'}`)
    }
    
    console.log('🎉 All Prisma types are working correctly!')
    
  } catch (error) {
    console.error('❌ Prisma types test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaTypes()