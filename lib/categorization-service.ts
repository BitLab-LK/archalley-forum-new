
// Enhanced categorization logic patterns
// File: lib/categorization-service.ts

import { PrismaClient } from '@prisma/client'
import { validateCategorization } from './categorization-validation'
import { clearCategoryCache } from './ai-service'

export class CategorizationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all categories from database with caching support
   */
  async getAllCategories() {
    try {
      const categories = await this.prisma.categories.findMany({
        select: { 
          id: true, 
          name: true, 
          color: true,
          slug: true,
          postCount: true
        },
        orderBy: { name: 'asc' }
      })
      
      console.log("📋 Retrieved categories from database:", categories.length)
      return categories
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error)
      throw error
    }
  }

  /**
   * Get category names only (for AI service)
   */
  async getCategoryNames(): Promise<string[]> {
    try {
      const categories = await this.prisma.categories.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
      })
      
      const categoryNames = categories.map(cat => cat.name).filter(name => 
        name && typeof name === 'string' && name.trim().length > 0
      )
      
      console.log("📋 Retrieved category names:", categoryNames)
      return categoryNames
    } catch (error) {
      console.error("❌ Failed to fetch category names:", error)
      return ["Other"] // Fallback
    }
  }

  /**
   * Validate that category IDs exist in database
   */
  async validateCategoryIds(categoryIds: string[]): Promise<{ valid: string[], invalid: string[] }> {
    if (!categoryIds || categoryIds.length === 0) {
      return { valid: [], invalid: [] }
    }

    try {
      const existingCategories = await this.prisma.categories.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true }
      })
      
      const validIds = existingCategories.map(cat => cat.id)
      const invalidIds = categoryIds.filter(id => !validIds.includes(id))
      
      console.log("✅ Category validation:", { validIds, invalidIds })
      
      return { valid: validIds, invalid: invalidIds }
    } catch (error) {
      console.error("❌ Failed to validate category IDs:", error)
      return { valid: [], invalid: categoryIds }
    }
  }

  /**
   * Convert category names to IDs (useful for AI suggestions)
   */
  async getCategoryIdsByNames(categoryNames: string[]): Promise<{ id: string, name: string }[]> {
    if (!categoryNames || categoryNames.length === 0) {
      return []
    }

    try {
      const categories = await this.prisma.categories.findMany({
        where: { 
          name: { 
            in: categoryNames,
            mode: 'insensitive' // Case-insensitive matching
          } 
        },
        select: { id: true, name: true }
      })
      
      console.log("🔍 Found categories by names:", categories)
      return categories
    } catch (error) {
      console.error("❌ Failed to find categories by names:", error)
      return []
    }
  }

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
        primaryCategoryId: validated.categoryId,
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
        postCategories: {
          include: { category: true }
        },
        _count: { select: { Comment: true } }
      },
      ...options
    })
  }

  /**
   * Add a new category and clear AI cache
   */
  async addCategory(categoryData: {
    id: string
    name: string
    color: string
    slug: string
  }) {
    try {
      const newCategory = await this.prisma.categories.create({
        data: {
          ...categoryData,
          postCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      // Clear AI cache so new category is immediately available
      clearCategoryCache()
      console.log("✅ Added new category and cleared AI cache:", newCategory.name)
      
      return newCategory
    } catch (error) {
      console.error("❌ Failed to add category:", error)
      throw error
    }
  }

  /**
   * Update a category and clear AI cache
   */
  async updateCategory(categoryId: string, updateData: Partial<{
    name: string
    color: string
    slug: string
  }>) {
    try {
      const updatedCategory = await this.prisma.categories.update({
        where: { id: categoryId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })
      
      // Clear AI cache so changes are immediately reflected
      clearCategoryCache()
      console.log("✅ Updated category and cleared AI cache:", updatedCategory.name)
      
      return updatedCategory
    } catch (error) {
      console.error("❌ Failed to update category:", error)
      throw error
    }
  }

  /**
   * Delete a category and clear AI cache
   */
  async deleteCategory(categoryId: string) {
    try {
      const deletedCategory = await this.prisma.categories.delete({
        where: { id: categoryId }
      })
      
      // Clear AI cache so deleted category is immediately removed
      clearCategoryCache()
      console.log("✅ Deleted category and cleared AI cache:", deletedCategory.name)
      
      return deletedCategory
    } catch (error) {
      console.error("❌ Failed to delete category:", error)
      throw error
    }
  }
}
