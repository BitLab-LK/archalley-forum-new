
// Enhanced Post validation schema for clean categorization structure
import { z } from 'zod'

// New clean categorization schema
export const cleanPostCategorizationSchema = z.object({
  categoryIds: z.array(z.string())
    .min(1, 'At least one category is required')
    .max(4, 'Maximum 4 categories allowed')
    .refine(data => data.length === new Set(data).size, {
      message: 'Duplicate categories not allowed'
    }),
    
  primaryCategoryId: z.string()
    .min(1, 'Primary category is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid category ID format'),
    
  aiSuggestedCategoryNames: z.array(z.string()).optional().default([]),
  aiConfidence: z.number().min(0).max(1).optional(),
}).refine(data => data.categoryIds[0] === data.primaryCategoryId, {
  message: 'Primary category must be the first item in categories array',
  path: ['primaryCategoryId']
})

// Legacy validation schema (for backward compatibility during migration)
export const legacyPostCategorizationSchema = z.object({
  categoryId: z.string()
    .min(1, 'Primary category is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid category ID format'),
    
  categoryIds: z.array(z.string())
    .min(1, 'At least one category is required')
    .max(4, 'Maximum 4 categories allowed')
    .refine(data => data.length === new Set(data).size, {
      message: 'Duplicate categories not allowed'
    }),
}).refine(data => data.categoryIds[0] === data.categoryId, {
  message: 'Primary category must match first item in categories array',
  path: ['categoryId']
})

// Runtime validation functions
export function validateCleanCategorization(data: {
  categoryIds: string[]
  primaryCategoryId: string
  aiSuggestedCategoryNames?: string[]
  aiConfidence?: number
}) {
  const result = cleanPostCategorizationSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`Categorization validation failed: ${result.error.message}`)
  }
  return result.data
}

export function validateLegacyCategorization(data: {
  categoryId: string
  categoryIds: string[]
}) {
  const result = legacyPostCategorizationSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`Legacy categorization validation failed: ${result.error.message}`)
  }
  return result.data
}

// Helper function to convert legacy format to clean format
export function migrateLegacyToClean(legacyData: {
  categoryId: string
  categoryIds: string[]
  aiCategory?: string
  aiCategories?: string[]
}): {
  categoryIds: string[]
  primaryCategoryId: string
  aiSuggestedCategoryNames: string[]
} {
  // Ensure categoryIds includes categoryId and remove duplicates
  const cleanCategoryIds = Array.from(new Set([
    legacyData.categoryId,
    ...(legacyData.categoryIds || [])
  ]))
  
  // Collect AI suggestions
  const aiSuggestions: string[] = []
  if (legacyData.aiCategory) aiSuggestions.push(legacyData.aiCategory)
  if (legacyData.aiCategories) {
    legacyData.aiCategories.forEach(cat => {
      if (!aiSuggestions.includes(cat)) {
        aiSuggestions.push(cat)
      }
    })
  }
  
  return {
    categoryIds: cleanCategoryIds,
    primaryCategoryId: legacyData.categoryId,
    aiSuggestedCategoryNames: aiSuggestions
  }
}

// Backward compatibility export (DEPRECATED)
export const postCategorizationSchema = legacyPostCategorizationSchema
export const validateCategorization = validateLegacyCategorization
