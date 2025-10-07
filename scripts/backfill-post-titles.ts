/**
 * Backfill Post Titles Script
 * 
 * This script updates existing posts that have NULL titles
 * by generating titles from their content, especially for image posts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate title from post content
 * Same logic as the API to ensure consistency
 */
function generateTitleFromContent(content: string): string {
  if (!content || content.trim().length === 0) {
    return "Untitled Post"
  }
  
  const cleanContent = content.trim()
  
  // Extract first sentence or meaningful phrase
  const firstSentence = cleanContent.split(/[.!?]/)[0].trim()
  
  // If first sentence is short enough, use it
  if (firstSentence.length <= 80 && firstSentence.length > 0) {
    return firstSentence
  }
  
  // Truncate at word boundary if too long
  if (firstSentence.length > 80) {
    const words = firstSentence.split(' ')
    let title = ''
    for (const word of words) {
      if ((title + ' ' + word).length > 77) break
      title += (title ? ' ' : '') + word
    }
    return title + '...'
  }
  
  // Fallback to first 77 characters
  return cleanContent.substring(0, 77) + (cleanContent.length > 77 ? '...' : '')
}

async function backfillPostTitles() {
  try {
    console.log('🔍 Finding posts with NULL titles...')
    
    // Find all posts with NULL titles
    const postsWithNullTitles = await prisma.post.findMany({
      where: {
        OR: [
          { title: null },
          { title: '' },
          { title: 'NULL' },
          { title: 'Untitled Post' }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        attachments: {
          select: {
            id: true,
            mimeType: true
          }
        }
      }
    })
    
    console.log(`📊 Found ${postsWithNullTitles.length} posts with NULL/empty titles`)
    
    if (postsWithNullTitles.length === 0) {
      console.log('✅ No posts need title updates!')
      return
    }
    
    let updatedCount = 0
    let skippedCount = 0
    
    // Process each post
    for (const post of postsWithNullTitles) {
      const hasImages = post.attachments.some(att => 
        att.mimeType?.startsWith('image/')
      )
      
      // Generate title from content
      const newTitle = generateTitleFromContent(post.content)
      
      // Skip if we can't generate a meaningful title
      if (newTitle === 'Untitled Post' && !hasImages) {
        console.log(`⏭️  Skipping post ${post.id} - no meaningful content`)
        skippedCount++
        continue
      }
      
      try {
        await prisma.post.update({
          where: { id: post.id },
          data: { title: newTitle }
        })
        
        const postType = hasImages ? '🖼️  Image' : '📝 Text'
        console.log(`✅ ${postType} post ${post.id}: "${newTitle}"`)
        updatedCount++
        
      } catch (error) {
        console.error(`❌ Failed to update post ${post.id}:`, error)
      }
    }
    
    console.log('\n🎉 Backfill completed!')
    console.log(`📊 Summary: ${updatedCount} updated, ${skippedCount} skipped`)
    
  } catch (error) {
    console.error('❌ Backfill failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  backfillPostTitles()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { backfillPostTitles }