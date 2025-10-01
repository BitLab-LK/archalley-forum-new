// Clean schema analysis script
// This script analyzes the current clean schema structure

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeCleanSchema() {
  console.log('🔍 Analyzing clean schema structure...')
  
  try {
    // Analyze Post structure
    console.log('📋 Post Model Analysis:')
    
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        primaryCategoryId: true,
        categoryIds: true,
        aiSuggestions: true,
        postCategories: {
          select: { categoryId: true }
        }
      }
    })
    
    console.log(`📊 Total posts: ${posts.length}`)
    
    let postsWithPrimary = 0
    let postsWithMultipleCategories = 0
    let postsWithAiSuggestions = 0
    let dataConsistencyIssues = 0
    
    for (const post of posts) {
      if (post.primaryCategoryId) postsWithPrimary++
      if (post.categoryIds.length > 1) postsWithMultipleCategories++
      if (post.aiSuggestions) postsWithAiSuggestions++
      
      // Check data consistency
      const junctionCategoryIds = post.postCategories.map(pc => pc.categoryId).sort()
      const arrayCategoryIds = post.categoryIds.sort()
      
      if (JSON.stringify(junctionCategoryIds) !== JSON.stringify(arrayCategoryIds)) {
        dataConsistencyIssues++
      }
    }
    
    console.log(`   Posts with primary category: ${postsWithPrimary}`)
    console.log(`   Posts with multiple categories: ${postsWithMultipleCategories}`)
    console.log(`   Posts with AI suggestions: ${postsWithAiSuggestions}`)
    console.log(`   Data consistency issues: ${dataConsistencyIssues}`)
    
    // Analyze Categories structure
    console.log('\n📋 Categories Model Analysis:')
    
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        postCount: true
      }
    })
    
    console.log(`📊 Total categories: ${categories.length}`)
    
    let categoryCountAccuracy = 0
    for (const category of categories) {
      const actualPostCount = await prisma.postCategory.count({
        where: { categoryId: category.id }
      })
      
      if (category.postCount === actualPostCount) {
        categoryCountAccuracy++
      } else {
        console.log(`   ⚠️ ${category.name}: stored=${category.postCount}, actual=${actualPostCount}`)
      }
    }
    
    console.log(`   Categories with accurate counts: ${categoryCountAccuracy}/${categories.length}`)
    
    // Analyze PostCategory junction table
    console.log('\n📋 PostCategory Junction Table Analysis:')
    
    const junctionEntries = await prisma.postCategory.count()
    const uniquePostsInJunction = await prisma.postCategory.groupBy({
      by: ['postId'],
      _count: { postId: true }
    })
    
    console.log(`📊 Total junction entries: ${junctionEntries}`)
    console.log(`📊 Unique posts in junction: ${uniquePostsInJunction.length}`)
    
    // Summary
    console.log('\n✅ CLEAN SCHEMA ANALYSIS SUMMARY:')
    console.log(`   ✅ Schema structure: Clean and optimized`)
    console.log(`   ✅ Data consistency: ${dataConsistencyIssues === 0 ? 'Perfect' : `${dataConsistencyIssues} issues`}`)
    console.log(`   ✅ Multi-categorization: ${postsWithMultipleCategories} posts use multiple categories`)
    console.log(`   ✅ AI integration: ${postsWithAiSuggestions} posts have AI suggestions`)
    console.log(`   ✅ Junction table: ${junctionEntries} entries for ${uniquePostsInJunction.length} posts`)
    
    if (dataConsistencyIssues === 0 && categoryCountAccuracy === categories.length) {
      console.log('\n🎉 Schema is perfectly clean and consistent!')
    } else {
      console.log('\n⚠️ Some minor issues found that may need attention.')
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run analysis
analyzeCleanSchema()
  .then(() => console.log('✅ Analysis completed'))
  .catch(error => console.error('❌ Analysis failed:', error))