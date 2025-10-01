// Final validation script for the clean schema
// This checks the current state after migration

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function validateFinalSchema() {
  console.log('🔍 Final schema validation...')
  
  try {
    // Step 1: Check PostCategory junction table
    console.log('📋 Step 1: Checking PostCategory junction table...')
    
    const junctionEntries = await prisma.postCategory.count()
    console.log(`📊 PostCategory entries: ${junctionEntries}`)
    
    // Step 2: Check posts with primary categories
    console.log('📋 Step 2: Checking posts with primary categories...')
    
    const postsWithPrimary = await prisma.post.count({
      where: { primaryCategoryId: { not: null } }
    })
    console.log(`📊 Posts with primary category: ${postsWithPrimary}`)
    
    // Step 3: Check data consistency
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
      const junctionIds = post.postCategories.map(pc => pc.categoryId).sort()
      const arrayIds = (post.categoryIds || []).sort()
      
      if (JSON.stringify(junctionIds) !== JSON.stringify(arrayIds)) {
        inconsistencies++
      }
    }
    
    console.log(`📊 Data inconsistencies: ${inconsistencies}`)
    
    // Step 4: Category statistics
    console.log('📋 Step 4: Category statistics...')
    
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        postCount: true
      }
    })
    
    console.log(`📊 Total categories: ${categories.length}`)
    
    // Check category counts manually
    let categoryCountIssues = 0
    for (const category of categories) {
      const actualPostCount = await prisma.postCategory.count({
        where: { categoryId: category.id }
      })
      if (category.postCount !== actualPostCount) {
        categoryCountIssues++
        console.warn(`⚠️ Category ${category.name}: stored count ${category.postCount}, actual count ${actualPostCount}`)
      }
    }
    
    console.log(`📊 Category count issues: ${categoryCountIssues}`)
    
    // Summary
    console.log('\n✅ FINAL SCHEMA STATUS:')
    console.log(`   ✅ PostCategory junction table: ${junctionEntries} entries`)
    console.log(`   ✅ Posts with primary categories: ${postsWithPrimary}`)
    console.log(`   ✅ Data inconsistencies: ${inconsistencies}`)
    console.log(`   ✅ Category count issues: ${categoryCountIssues}`)
    console.log(`   ✅ Total categories: ${categories.length}`)
    
    if (inconsistencies === 0 && categoryCountIssues === 0) {
      console.log('\n🎉 Schema migration completed successfully! All data is consistent.')
    } else {
      console.log('\n⚠️ Some issues found that may need attention.')
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run validation
validateFinalSchema()
  .then(() => console.log('✅ Validation completed'))
  .catch(error => console.error('❌ Validation failed:', error))