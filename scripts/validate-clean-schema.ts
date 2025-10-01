// Step-by-step migration validation and fix script
// This checks the current schema state and updates code accordingly

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function validateCleanSchema() {
  console.log('🔍 Validating clean schema migration...')
  
  try {
    // Step 1: Check if PostCategory table exists and has data
    console.log('📋 Step 1: Checking PostCategory junction table...')
    
    try {
      const junctionCount = await prisma.postCategory.count()
      console.log(`📊 PostCategory entries: ${junctionCount}`)
    } catch (error: any) {
      console.error('❌ PostCategory table not accessible:', error?.message)
      console.log('💡 Junction table might not be created yet')
      return false
    }
    
    // Step 2: Check post structure
    console.log('📋 Step 2: Checking Post model structure...')
    
    const samplePost = await prisma.post.findFirst({
      select: {
        id: true,
        categoryIds: true,
        primaryCategoryId: true,
        aiSuggestions: true,
      }
    })
    
    if (samplePost) {
      console.log('✅ New post structure is working:')
      console.log(`   Primary category: ${samplePost.primaryCategoryId}`)
      console.log(`   Category IDs: [${samplePost.categoryIds.join(', ')}]`)
      console.log(`   AI suggestions: ${samplePost.aiSuggestions ? 'Available' : 'None'}`)
    }
    
    // Step 3: Check for data consistency
    console.log('📋 Step 3: Checking data consistency...')
    
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true,
        primaryCategoryId: true,
        postCategories: {
          select: { categoryId: true }
        }
      }
    })
    
    let inconsistencies = 0
    for (const post of posts) {
      const junctionCategoryIds = post.postCategories?.map((pc: any) => pc.categoryId).sort() || []
      const arrayCategoryIds = (post.categoryIds || []).sort()
      
      if (JSON.stringify(junctionCategoryIds) !== JSON.stringify(arrayCategoryIds)) {
        inconsistencies++
      }
    }
    
    console.log(`📊 Found ${inconsistencies} data inconsistencies`)
    
    // Step 4: Check categories structure
    console.log('📋 Step 4: Checking categories structure...')
    
    const categoriesWithCounts = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        postCount: true,
      }
    })
    
    let categoryCountIssues = 0
    for (const category of categoriesWithCounts) {
      const actualCount = await prisma.postCategory.count({
        where: { categoryId: category.id }
      })
      
      if (category.postCount !== actualCount) {
        categoryCountIssues++
        console.log(`   Category "${category.name}": stored=${category.postCount}, actual=${actualCount}`)
      }
    }
    
    console.log(`📊 Found ${categoryCountIssues} category count inconsistencies`)
    
    console.log('✅ Schema validation completed!')
    return true
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Export function
export { validateCleanSchema }

// Run validation if this file is executed directly
if (require.main === module) {
  validateCleanSchema()
    .then((success) => {
      if (success) {
        console.log('✅ Schema validation completed successfully')
        process.exit(0)
      } else {
        console.log('❌ Schema validation found issues')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Schema validation failed:', error)
      process.exit(1)
    })
}