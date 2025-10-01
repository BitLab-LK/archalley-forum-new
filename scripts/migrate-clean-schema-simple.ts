// Simple migration script to transition to the clean schema structure
// This handles the current schema transition carefully

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToCleanSchema() {
  console.log('🔄 Starting migration to clean schema structure...')
  
  try {
    // Step 1: Check current state
    console.log('📋 Step 1: Checking current data state...')
    
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true,
      }
    })
    
    console.log(`📊 Found ${posts.length} posts to migrate`)
    
    // Step 2: Create junction table entries for each post
    console.log('📋 Step 2: Creating PostCategory junction table entries...')
    
    let junctionEntriesCreated = 0
    
    for (const post of posts) {
      if (post.categoryIds && post.categoryIds.length > 0) {
        // Create junction table entries for each category
        for (const categoryId of post.categoryIds) {
          try {
            await prisma.postCategory.create({
              data: {
                postId: post.id,
                categoryId: categoryId
              }
            })
            junctionEntriesCreated++
          } catch (error: any) {
            // Skip if already exists (in case of re-run)
            if (!error?.message?.includes('Unique constraint')) {
              console.warn(`⚠️ Failed to create junction entry for post ${post.id}, category ${categoryId}:`, error?.message || 'Unknown error')
            }
          }
        }
        
        // Set primaryCategoryId to the first category
        await prisma.post.update({
          where: { id: post.id },
          data: {
            primaryCategoryId: post.categoryIds[0]
          }
        })
      }
    }
    
    console.log(`✅ Created ${junctionEntriesCreated} junction table entries`)
    
    // Step 3: Update category post counts
    console.log('📈 Step 3: Updating category post counts...')
    
    const categories = await prisma.categories.findMany({
      select: { id: true }
    })
    
    for (const category of categories) {
      const postCount = await prisma.postCategory.count({
        where: { categoryId: category.id }
      })
      
      await prisma.categories.update({
        where: { id: category.id },
        data: { postCount }
      })
    }
    
    console.log('✅ Category post counts updated')
    
    // Step 4: Validation
    console.log('🔍 Step 4: Validating migration...')
    
    const totalJunctionEntries = await prisma.postCategory.count()
    const postsWithPrimaryCategory = await prisma.post.count({
      where: {
        primaryCategoryId: { not: null }
      }
    })
    
    console.log(`📊 Total junction entries: ${totalJunctionEntries}`)
    console.log(`📊 Posts with primary category: ${postsWithPrimaryCategory}`)
    
    console.log('🎉 Migration to clean schema completed successfully!')
    
    // Summary
    console.log('\n📊 MIGRATION SUMMARY:')
    console.log(`   Junction entries created: ${junctionEntriesCreated}`)
    console.log(`   Posts with categories: ${postsWithPrimaryCategory}`)
    console.log(`   Categories updated: ${categories.length}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export function
export { migrateToCleanSchema }

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToCleanSchema()
    .then(() => {
      console.log('✅ Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}