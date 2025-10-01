// Migration script to transition to the cleaned schema structure
// This script safely migrates from the old redundant structure to the new clean structure

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToCleanSchema() {
  console.log('🔄 Starting migration to clean schema structure...')
  
  try {
    // Step 1: Create the new junction table entries
    console.log('📋 Step 1: Creating PostCategory junction table entries...')
    
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true,
      }
    })
    
    console.log(`📊 Found ${posts.length} posts to migrate`)
    
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
          } catch (error) {
            // Skip if already exists (in case of re-run)
            if (!error.message.includes('Unique constraint')) {
              console.warn(`⚠️ Failed to create junction entry for post ${post.id}, category ${categoryId}:`, error.message)
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
    
    // Step 2: Validate the migration
    console.log('🔍 Step 2: Validating migration...')
    
    const totalJunctionEntries = await prisma.postCategory.count()
    const postsWithPrimaryCategory = await prisma.post.count({
      where: {
        primaryCategoryId: { not: null }
      }
    })
    
    console.log(`📊 Total junction entries: ${totalJunctionEntries}`)
    console.log(`📊 Posts with primary category: ${postsWithPrimaryCategory}`)
    
    // Step 3: Update category post counts based on junction table
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
    
    // Step 4: Validate data consistency
    console.log('🔍 Step 4: Final consistency check...')
    
    // Check for orphaned junction entries
    const orphanedJunctions = await prisma.postCategory.findMany({
      where: {
        OR: [
          { post: { is: null } },
          { category: { is: null } }
        ]
      },
      select: { id: true, postId: true, categoryId: true }
    })
    
    if (orphanedJunctions.length > 0) {
      console.warn(`⚠️ Found ${orphanedJunctions.length} orphaned junction entries`)
      // Clean up orphaned entries
      await prisma.postCategory.deleteMany({
        where: {
          id: { in: orphanedJunctions.map(o => o.id) }
        }
      })
      console.log('✅ Cleaned up orphaned junction entries')
    }
    
    // Verify categoryIds arrays match junction table
    const postsToCheck = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true,
        postCategories: {
          select: { categoryId: true }
        }
      }
    })
    
    let consistencyIssues = 0
    for (const post of postsToCheck) {
      const junctionCategoryIds = post.postCategories.map(pc => pc.categoryId).sort()
      const arrayCategoryIds = (post.categoryIds || []).sort()
      
      if (JSON.stringify(junctionCategoryIds) !== JSON.stringify(arrayCategoryIds)) {
        consistencyIssues++
        // Fix the inconsistency by updating categoryIds array
        await prisma.post.update({
          where: { id: post.id },
          data: { categoryIds: junctionCategoryIds }
        })
      }
    }
    
    if (consistencyIssues > 0) {
      console.log(`✅ Fixed ${consistencyIssues} consistency issues`)
    } else {
      console.log('✅ No consistency issues found')
    }
    
    console.log('🎉 Migration to clean schema completed successfully!')
    
    // Summary
    console.log('\n📊 MIGRATION SUMMARY:')
    console.log(`   Junction entries created: ${junctionEntriesCreated}`)
    console.log(`   Posts with categories: ${postsWithPrimaryCategory}`)
    console.log(`   Categories updated: ${categories.length}`)
    console.log(`   Consistency issues fixed: ${consistencyIssues}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Rollback function
async function rollbackCleanSchema() {
  console.log('🔄 Rolling back to previous schema...')
  
  try {
    // Clear junction table
    await prisma.postCategory.deleteMany()
    
    // Clear primaryCategoryId
    await prisma.post.updateMany({
      data: { primaryCategoryId: null }
    })
    
    console.log('✅ Rollback completed')
    
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export functions
export { migrateToCleanSchema, rollbackCleanSchema }

// Run migration if this file is executed directly
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'rollback') {
    rollbackCleanSchema()
      .then(() => {
        console.log('✅ Rollback completed successfully')
        process.exit(0)
      })
      .catch((error) => {
        console.error('❌ Rollback failed:', error)
        process.exit(1)
      })
  } else {
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
}