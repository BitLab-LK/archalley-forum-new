
// Enhanced categorization logic patterns
// File: lib/categorization-utils.ts

import { PrismaClient } from '@prisma/client'
import { validateCategorization } from './categorization-validation'

export class CategorizationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Safely assign categories to a post with validation
   */
  async assignCategories(postData: {
    categoryId: string
    categoryIds: string[]
  }) {
    // 1. Validate input structure
    const validated = validateCategorization(postData)
    
    // 2. Verify all categories exist
    const existingCategories = await this.prisma.categories.findMany({
      where: { id: { in: validated.categoryIds } },
      select: { id: true, name: true }
    })
    
    if (existingCategories.length !== validated.categoryIds.length) {
      const missing = validated.categoryIds.filter(id => 
        !existingCategories.find(cat => cat.id === id)
      )
      throw new Error(`Categories not found: ${missing.join(', ')}`)
    }
    
    return validated
  }

  /**
   * Update post categories with proper validation
   */
  async updatePostCategories(postId: string, newCategoryIds: string[]) {
    const categoryData = {
      categoryId: newCategoryIds[0],
      categoryIds: newCategoryIds
    }
    
    const validated = await this.assignCategories(categoryData)
    
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        categoryId: validated.categoryId,
        categoryIds: validated.categoryIds,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Get posts by category with optimized query
   */
  async getPostsByCategory(categoryId: string, options = {}) {
    return this.prisma.post.findMany({
      where: {
        categoryIds: { has: categoryId }
      },
      include: {
        users: { select: { id: true, name: true } },
        categories: true,
        _count: { select: { Comment: true } }
      },
      ...options
    })
  }
}
