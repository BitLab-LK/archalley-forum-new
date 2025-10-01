// DEPRECATED: This script used old schema fields that no longer exist// DEPRECATED: This script uses old schema fields that no longer exist// DEPRECATED: This script uses old schema fields that no longer exist

// The schema has been cleaned up - use the new validation scripts instead

// The schema has been cleaned up - use the new validation scripts instead// The schema has been cleaned up - use the new validation scripts instead

console.log("❌ This script is deprecated after schema cleanup.")

console.log("✅ Use scripts/validate-final-schema.ts instead")// // 

console.log("🔄 Schema was successfully cleaned up - old redundant fields removed")

// Old fields that were removed:// Old fields that were removed:

process.exit(0)
// - categoryId (use primaryCategoryId instead)  // - categoryId (use primaryCategoryId instead)  

// - aiCategory, aiCategories (use aiSuggestions JSON instead)// - aiCategory, aiCategories (use aiSuggestions JSON instead)

////

// This file is kept for reference but should not be used// This file is kept for reference but should not be used



console.log("❌ This script is deprecated after schema cleanup.")console.log("❌ This script is deprecated after schema cleanup.")

console.log("✅ Use scripts/validate-final-schema.ts instead")console.log("✅ Use scripts/validate-final-schema.ts instead")

console.log("🔄 Schema was successfully cleaned up - old redundant fields removed")console.log("🔄 Schema was successfully cleaned up - old redundant fields removed")



process.exit(0)process.exit(0)
    
    console.log(`📊 Found ${posts.length} posts to check`)
    
    let fixedCount = 0
    
    for (const post of posts) {
      const updates: any = {}
      let needsUpdate = false
      
      // Fix 1: Ensure categoryIds includes categoryId and is consistent
      let cleanCategoryIds = Array.from(new Set(post.categoryIds || []))
      
      // If categoryId exists but not in categoryIds, add it at the beginning
      if (post.categoryId && !cleanCategoryIds.includes(post.categoryId)) {
        cleanCategoryIds = [post.categoryId, ...cleanCategoryIds]
        needsUpdate = true
      }
      
      // If categoryIds exists but categoryId doesn't match first element, fix it
      if (cleanCategoryIds.length > 0 && post.categoryId !== cleanCategoryIds[0]) {
        updates.categoryId = cleanCategoryIds[0]
        needsUpdate = true
      }
      
      // Update categoryIds if it was modified
      if (needsUpdate && cleanCategoryIds.length > 0) {
        updates.categoryIds = cleanCategoryIds
      }
      
      // Fix 2: Clean up AI categories to match database categories
      const allCategories = await prisma.categories.findMany({
        select: { name: true }
      })
      const validCategoryNames = new Set(allCategories.map(cat => cat.name))
      
      // Clean aiCategories to only include valid category names
      if (post.aiCategories && post.aiCategories.length > 0) {
        const validAiCategories = post.aiCategories.filter(aiCat => 
          validCategoryNames.has(aiCat)
        )
        
        if (validAiCategories.length !== post.aiCategories.length) {
          updates.aiCategories = validAiCategories
          needsUpdate = true
        }
        
        // Fix aiCategory to match first valid aiCategory
        if (validAiCategories.length > 0 && post.aiCategory !== validAiCategories[0]) {
          updates.aiCategory = validAiCategories[0]
          needsUpdate = true
        }
      }
      
      // Remove invalid aiCategory if it doesn't match database
      if (post.aiCategory && !validCategoryNames.has(post.aiCategory)) {
        updates.aiCategory = null
        needsUpdate = true
      }
      
      // Apply updates if any
      if (needsUpdate) {
        await prisma.post.update({
          where: { id: post.id },
          data: updates
        })
        fixedCount++
      }
    }
    
    console.log(`✅ Fixed inconsistencies in ${fixedCount} posts`)
    
    // Step 2: Validate current state
    console.log('🔍 Step 2: Validating current data state...')
    
    const totalPosts = await prisma.post.count()
    const postsWithCategories = await prisma.post.count({
      where: {
        categoryIds: {
          isEmpty: false
        }
      }
    })
    
    console.log(`📊 Total posts: ${totalPosts}`)
    console.log(`📊 Posts with categories: ${postsWithCategories}`)
    
    // Step 3: Update category post counts
    console.log('📈 Step 3: Updating category post counts...')
    
    const categories = await prisma.categories.findMany({
      select: { id: true }
    })
    
    for (const category of categories) {
      const postCount = await prisma.post.count({
        where: {
          categoryIds: {
            has: category.id
          }
        }
      })
      
      await prisma.categories.update({
        where: { id: category.id },
        data: { postCount }
      })
    }
    
    console.log('✅ Category post counts updated')
    
    // Step 4: Check for remaining inconsistencies
    console.log('🔍 Step 4: Final consistency check...')
    
    const inconsistentPosts = await prisma.post.findMany({
      where: {
        OR: [
          {
            AND: [
              { categoryIds: { isEmpty: false } },
              { categoryId: "" } // Empty string instead of null
            ]
          }
        ]
      },
      select: { id: true, categoryIds: true, categoryId: true }
    })
    
    if (inconsistentPosts.length > 0) {
      console.warn(`⚠️ Found ${inconsistentPosts.length} posts with remaining inconsistencies:`)
      inconsistentPosts.forEach(post => {
        console.warn(`- Post ${post.id}: categoryIds=${JSON.stringify(post.categoryIds)}, categoryId=${post.categoryId}`)
      })
    } else {
      console.log('✅ No remaining inconsistencies found')
    }
    
    console.log('🎉 Categorization cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Rollback function (in case we need to revert)
async function rollbackCategorization() {
  console.log('🔄 Rolling back categorization migration...')
  
  try {
    // For the current schema, there's not much to rollback
    // since we're only fixing existing data, not adding new fields
    console.log('ℹ️ Current migration only fixes existing data, no rollback needed')
    console.log('✅ Rollback completed')
    
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export functions for use in other scripts
export { migrateCategorization, rollbackCategorization }

// Run migration if this file is executed directly
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'rollback') {
    rollbackCategorization()
      .then(() => {
        console.log('✅ Rollback completed successfully')
        process.exit(0)
      })
      .catch((error) => {
        console.error('❌ Rollback failed:', error)
        process.exit(1)
      })
  } else {
    migrateCategorization()
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