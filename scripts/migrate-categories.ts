import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateCategoryIds() {
  console.log('🔄 Starting migration of categoryIds...')
  
  try {
    // Get all posts that don't have categoryIds set
    const posts = await prisma.post.findMany({
      where: {
        categoryIds: { equals: [] }
      },
      select: {
        id: true,
        categoryId: true,
        categoryIds: true,
        aiCategories: true
      }
    })

    console.log(`📊 Found ${posts.length} posts to migrate`)

    if (posts.length === 0) {
      console.log('✅ No posts need migration')
      return
    }

    // Get all categories for AI category name to ID mapping
    const allCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    })
    
    const categoryNameToId = new Map(
      allCategories.map(cat => [cat.name.toLowerCase(), cat.id])
    )

    let migrated = 0
    
    for (const post of posts) {
      const categoryIds = [post.categoryId] // Always include primary category
      
      // Add AI categories if they exist and match actual categories
      if (post.aiCategories && post.aiCategories.length > 0) {
        for (const aiCategoryName of post.aiCategories) {
          const categoryId = categoryNameToId.get(aiCategoryName.toLowerCase())
          if (categoryId && !categoryIds.includes(categoryId)) {
            categoryIds.push(categoryId)
          }
        }
      }
      
      // Update the post with the new categoryIds
      await prisma.post.update({
        where: { id: post.id },
        data: { categoryIds }
      })
      
      migrated++
      
      if (migrated % 10 === 0) {
        console.log(`📝 Migrated ${migrated}/${posts.length} posts...`)
      }
    }

    console.log(`✅ Successfully migrated ${migrated} posts`)
    console.log('📊 Migration summary:')
    
    // Show summary statistics
    const stats = await prisma.post.findMany({
      select: {
        categoryIds: true
      }
    })
    
    const categoryCounts = new Map<number, number>()
    stats.forEach(post => {
      const count = post.categoryIds?.length || 0
      categoryCounts.set(count, (categoryCounts.get(count) || 0) + 1)
    })
    
    categoryCounts.forEach((count, categoryCount) => {
      console.log(`   ${count} posts have ${categoryCount} categories`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateCategoryIds().catch(console.error)