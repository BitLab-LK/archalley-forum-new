import { PrismaClient } from '@prisma/client'

// Type for Prisma transaction client
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

// Utility functions for real-time category post count updates

/**
 * Updates post count for a single category
 * @param prisma - Prisma client instance or transaction
 * @param categoryId - Category ID to update
 * @returns Promise<number> - New post count
 */
export async function updateCategoryPostCount(
  prisma: PrismaClient | PrismaTransaction, 
  categoryId: string
): Promise<number> {
  try {
    // Count actual posts for this category (both primary and secondary assignments)
    const actualPostCount = await prisma.post.count({
      where: {
        OR: [
          { categoryId: categoryId },
          { categoryIds: { has: categoryId } }
        ]
      }
    })

    // Update the category with the actual count
    await prisma.categories.update({
      where: { id: categoryId },
      data: { postCount: actualPostCount }
    })

    console.log(`📊 Updated category ${categoryId} post count to ${actualPostCount}`)
    return actualPostCount
  } catch (error) {
    console.error(`❌ Error updating category ${categoryId} post count:`, error)
    throw error
  }
}

/**
 * Updates post counts for multiple categories
 * @param prisma - Prisma client instance or transaction
 * @param categoryIds - Array of category IDs to update
 * @returns Promise<Record<string, number>> - Object with categoryId -> newCount mapping
 */
export async function updateMultipleCategoryPostCounts(
  prisma: PrismaClient | PrismaTransaction, 
  categoryIds: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {}
  
  for (const categoryId of categoryIds) {
    try {
      results[categoryId] = await updateCategoryPostCount(prisma, categoryId)
    } catch (error) {
      console.error(`❌ Failed to update category ${categoryId}:`, error)
      results[categoryId] = -1 // Indicate error
    }
  }
  
  return results
}

/**
 * Increments post count for categories (faster than recounting)
 * @param prisma - Prisma client instance or transaction
 * @param categoryIds - Array of category IDs to increment
 * @param increment - Number to add (default: 1, use negative for decrement)
 */
export async function incrementCategoryPostCounts(
  prisma: PrismaClient | PrismaTransaction, 
  categoryIds: string[], 
  increment: number = 1
): Promise<void> {
  try {
    await prisma.categories.updateMany({
      where: { id: { in: categoryIds } },
      data: { postCount: { increment } }
    })
    
    console.log(`📈 Incremented post counts for categories: ${categoryIds.join(', ')} by ${increment}`)
  } catch (error) {
    console.error('❌ Error incrementing category post counts:', error)
    throw error
  }
}

/**
 * Handles post category changes - decrements old, increments new
 * @param prisma - Prisma client instance or transaction
 * @param oldCategoryIds - Categories to decrement
 * @param newCategoryIds - Categories to increment
 */
export async function handlePostCategoryChange(
  prisma: PrismaClient | PrismaTransaction,
  oldCategoryIds: string[],
  newCategoryIds: string[]
): Promise<void> {
  try {
    // Decrement old categories
    if (oldCategoryIds.length > 0) {
      await incrementCategoryPostCounts(prisma, oldCategoryIds, -1)
    }
    
    // Increment new categories
    if (newCategoryIds.length > 0) {
      await incrementCategoryPostCounts(prisma, newCategoryIds, 1)
    }
    
    console.log(`🔄 Post category change: -1 from [${oldCategoryIds.join(', ')}], +1 to [${newCategoryIds.join(', ')}]`)
  } catch (error) {
    console.error('❌ Error handling post category change:', error)
    throw error
  }
}

/**
 * Syncs all category post counts (for periodic maintenance)
 * @param prisma - Prisma client instance or transaction
 * @returns Promise<Record<string, number>> - All updated counts
 */
export async function syncAllCategoryPostCounts(
  prisma: PrismaClient | PrismaTransaction
): Promise<Record<string, number>> {
  try {
    const categories = await prisma.categories.findMany({
      select: { id: true, name: true }
    })
    
    console.log(`🔄 Syncing post counts for ${categories.length} categories...`)
    
    const results: Record<string, number> = {}
    
    for (const category of categories) {
      results[category.id] = await updateCategoryPostCount(prisma, category.id)
    }
    
    console.log('✅ All category post counts synced')
    return results
  } catch (error) {
    console.error('❌ Error syncing all category post counts:', error)
    throw error
  }
}

/**
 * Gets current category post counts (without updating)
 * @param prisma - Prisma client instance or transaction
 * @returns Promise<Record<string, number>> - Current stored counts
 */
export async function getCurrentCategoryPostCounts(
  prisma: PrismaClient | PrismaTransaction
): Promise<Record<string, number>> {
  const categories = await prisma.categories.findMany({
    select: { id: true, postCount: true }
  })
  
  return categories.reduce((acc, cat) => {
    acc[cat.id] = cat.postCount
    return acc
  }, {} as Record<string, number>)
}