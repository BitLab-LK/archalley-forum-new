// Script to fix mismatched category IDs and slugs in the database
// This script will sync the ID field with the slug field for all categories

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCategoryIds() {
  try {
    console.log('🔍 Checking for categories with mismatched IDs and slugs...')
    
    // Find all categories where ID doesn't match slug
    const categories = await prisma.categories.findMany()
    const mismatchedCategories = categories.filter(cat => cat.id !== cat.slug)
    
    if (mismatchedCategories.length === 0) {
      console.log('✅ All category IDs are already synced with slugs!')
      return
    }
    
    console.log(`Found ${mismatchedCategories.length} categories with mismatched ID/slug:`)
    mismatchedCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ID="${cat.id}", Slug="${cat.slug}"`)
    })
    
    console.log('\n🔧 Starting fix process...')
    
    for (const category of mismatchedCategories) {
      const oldId = category.id
      const newId = category.slug
      
      console.log(`\n📝 Fixing category "${category.name}": ${oldId} → ${newId}`)
      
      // Check if the new ID already exists
      const existingCategory = await prisma.categories.findUnique({
        where: { id: newId }
      })
      
      if (existingCategory && existingCategory.id !== oldId) {
        console.log(`  ⚠️  Skipping "${category.name}" - ID "${newId}" already exists`)
        continue
      }
      
      // Use a transaction to update everything atomically
      await prisma.$transaction(async (tx) => {
        // Update all foreign key references
        const postUpdates = await tx.post.updateMany({
          where: { primaryCategoryId: oldId },
          data: { primaryCategoryId: newId }
        })
        
        const postCategoryUpdates = await tx.postCategory.updateMany({
          where: { categoryId: oldId },
          data: { categoryId: newId }
        })
        
        console.log(`  📊 Updated ${postUpdates.count} posts and ${postCategoryUpdates.count} post-category relations`)
        
        // Delete the old category
        await tx.categories.delete({
          where: { id: oldId }
        })
        
        // Create the new category with the correct ID
        await tx.categories.create({
          data: {
            id: newId, // ID now matches slug
            name: category.name,
            color: category.color,
            slug: category.slug,
            postCount: category.postCount,
            createdAt: category.createdAt,
            updatedAt: new Date()
          }
        })
        
        console.log(`  ✅ Successfully updated "${category.name}"`)
      })
    }
    
    console.log('\n🎉 All category IDs have been synced with slugs!')
    console.log('\n📋 Final verification:')
    
    // Verify the fix
    const updatedCategories = await prisma.categories.findMany({
      select: { id: true, name: true, slug: true }
    })
    
    const stillMismatched = updatedCategories.filter(cat => cat.id !== cat.slug)
    
    if (stillMismatched.length === 0) {
      console.log('✅ All categories now have matching ID and slug fields!')
    } else {
      console.log('❌ Some categories still have mismatched ID/slug:')
      stillMismatched.forEach(cat => {
        console.log(`  - ${cat.name}: ID="${cat.id}", Slug="${cat.slug}"`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error fixing category IDs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixCategoryIds()
  .then(() => {
    console.log('\n✨ Category ID fix completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Category ID fix failed:', error)
    process.exit(1)
  })