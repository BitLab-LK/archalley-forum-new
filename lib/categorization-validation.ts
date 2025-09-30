
// Enhanced Post validation schema
import { z } from 'zod'

export const postCategorizationSchema = z.object({
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

// Runtime validation function
export function validateCategorization(data: {categoryId: string, categoryIds: string[]}) {
  const result = postCategorizationSchema.safeParse(data)
  if (!result.success) {
    throw new Error(`Categorization validation failed: ${result.error.message}`)
  }
  return result.data
}
