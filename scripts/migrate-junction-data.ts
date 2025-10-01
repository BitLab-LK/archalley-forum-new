// Working migration script for the clean schema
// This populates the junction table with existing categoryIds data

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateData() {
  console.log('🔄 Starting data migration to junction table...')
  
  try {
    // Step 1: Get all posts with categoryIds
    console.log('📋 Step 1: Fetching posts with categories...')
    
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true,
      }
    })
    
    console.log(`📊 Found ${posts.length} posts to process`)
    
    // Step 2: Create junction table entries
    console.log('📋 Step 2: Creating junction table entries...')
    
    let created = 0
    let skipped = 0
    
    for (const post of posts) {
      if (post.categoryIds && post.categoryIds.length > 0) {
        // Set primary category
        await prisma.post.update({
          where: { id: post.id },
          data: {
            primaryCategoryId: post.categoryIds[0]
          }
        })
        
        // Create junction entries
        for (const categoryId of post.categoryIds) {
          try {
            await prisma.postCategory.create({
              data: {
                postId: post.id,
                categoryId: categoryId
              }
            })
            created++
          } catch (error: any) {
            if (error?.code === 'P2002') {
              // Unique constraint violation - already exists
              skipped++
            } else {
              console.warn(`⚠️ Error creating junction for post ${post.id}, category ${categoryId}:`, error?.message)
            }
          }
        }
      }
    }
    
    console.log(`✅ Created ${created} junction entries, skipped ${skipped} duplicates`)
    
    // Step 3: Update category post counts
    console.log('📋 Step 3: Updating category post counts...')
    
    const categories = await prisma.categories.findMany()
    
    for (const category of categories) {
      const actualCount = await prisma.postCategory.count({
        where: { categoryId: category.id }
      })
      
      await prisma.categories.update({
        where: { id: category.id },
        data: { postCount: actualCount }
      })
    }
    
    console.log('✅ Category counts updated')
    
    // Step 4: Validation
    console.log('📋 Step 4: Validating migration...')
    
    const totalJunctions = await prisma.postCategory.count()
    const postsWithPrimary = await prisma.post.count({
      where: { primaryCategoryId: { not: null } }
    })
    
    console.log(`📊 Total junction entries: ${totalJunctions}`)
    console.log(`📊 Posts with primary category: ${postsWithPrimary}`)
    
    console.log('🎉 Data migration completed successfully!')
    
    return {
      created,
      skipped,
      totalJunctions,
      postsWithPrimary
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export function
export { migrateData }

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData()
    .then((result) => {
      console.log('✅ Migration completed:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}