/**
 * Script to re-process existing Sinhala posts with enhanced categorization
 * 
 * This script will:
 * 1. Find all Sinhala posts that are only categorized as 'Informative'
 * 2. Re-process them using the enhanced AI categorization
 * 3. Update their categories and AI categories appropriately
 * 
 * @author Forum Development Team
 * @version 1.0
 * @since 2025-09-23
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function reprocessSinhalaPosts() {
  console.log('🔄 Re-processing Sinhala Posts with Enhanced Categorization')
  console.log('=' .repeat(60))

  try {
    // Find Sinhala posts that need reprocessing
    const sinhalaPosts = await prisma.post.findMany({
      where: {
        originalLanguage: 'Sinhala'
      },
      include: {
        categories: true,
        users: {
          select: { name: true }
        }
      }
    })

    console.log(`📊 Found ${sinhalaPosts.length} Sinhala posts to reprocess`)

    if (sinhalaPosts.length === 0) {
      console.log('✅ No Sinhala posts need reprocessing')
      return
    }

    // Get all available categories
    const allCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    })

    console.log('📋 Available categories:', allCategories.map(cat => cat.name))

    // Process each post
    for (let i = 0; i < sinhalaPosts.length; i++) {
      const post = sinhalaPosts[i]
      console.log(`\n🔄 Processing post ${i + 1}/${sinhalaPosts.length}`)
      console.log(`   👤 Author: ${post.users.name}`)
      console.log(`   📝 Content: "${post.content.substring(0, 60)}..."`)
      console.log(`   📂 Current Category: ${post.categories.name}`)
      console.log(`   📋 Current Category IDs: ${JSON.stringify(post.categoryIds)}`)

      try {
        // Enhanced categorization using keyword analysis
        const content = post.content.toLowerCase()
        const detectedCategories = []
        const categoryIds = []

        // Keep the original primary category
        if (!categoryIds.includes(post.categoryId)) {
          categoryIds.push(post.categoryId)
        }

        // Enhanced keyword detection for Sinhala content
        const categoryMappings = {
          'design': ['පරිසර', 'සැලසුම', 'නිර්මාණ', 'design', 'ගෘහ', 'architecture'],
          'business': ['ව්‍යාපාර', 'business', 'සමාගම', 'කර්මාන්ත', 'commercial'],
          'academic': ['අධ්‍යාපන', 'education', 'ඉගෙනීම', 'university', 'පාසල', 'research'],
          'career': ['වෘත්තීය', 'career', 'රැකියා', 'job', 'professional'],
          'construction': ['ඉදිකිරීම', 'construction', 'building', 'ගොඩනැගිල්ල'],
          'informative': ['තොරතුරු', 'information', 'guide', 'උපදෙස්']
        }

        // Score categories based on content
        const categoryScores = {}
        
        Object.entries(categoryMappings).forEach(([categoryName, keywords]) => {
          const category = allCategories.find(cat => cat.name.toLowerCase() === categoryName)
          if (!category) return

          let score = 0
          keywords.forEach(keyword => {
            if (content.includes(keyword.toLowerCase())) {
              score += 1
            }
          })

          if (score > 0) {
            categoryScores[category.name] = score
            if (!categoryIds.includes(category.id)) {
              categoryIds.push(category.id)
              detectedCategories.push(category.name)
            }
          }
        })

        // Limit to maximum 3 categories
        const sortedCategories = Object.entries(categoryScores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([name,]) => name)

        // Filter category IDs to match sorted categories
        const finalCategoryIds = categoryIds.slice(0, 3)
        const finalDetectedCategories = sortedCategories.filter(cat => 
          cat.toLowerCase() !== post.categories.name.toLowerCase()
        )

        console.log(`   🎯 Detected categories: ${sortedCategories.join(', ')}`)
        console.log(`   📊 Category scores:`, categoryScores)
        console.log(`   📋 Final category IDs: ${JSON.stringify(finalCategoryIds)}`)

        // Update the post if we detected additional categories
        if (finalCategoryIds.length > 1 || finalDetectedCategories.length > 0) {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              categoryIds: finalCategoryIds,
              aiCategories: finalDetectedCategories,
              aiCategory: sortedCategories[0] || post.categories.name
            }
          })

          // Update category post counts
          const newCategoryIds = finalCategoryIds.filter(id => !post.categoryIds.includes(id))
          if (newCategoryIds.length > 0) {
            await Promise.all(
              newCategoryIds.map(categoryId =>
                prisma.categories.update({
                  where: { id: categoryId },
                  data: { postCount: { increment: 1 } }
                }).catch(error => {
                  console.error(`Failed to update category count for ${categoryId}:`, error)
                })
              )
            )
          }

          console.log(`   ✅ Updated with ${finalCategoryIds.length} categories`)
        } else {
          console.log(`   ⏭️ No additional categories detected`)
        }

      } catch (error) {
        console.error(`   ❌ Error processing post ${post.id}:`, error)
      }
    }

    console.log('\n✅ Reprocessing completed')

  } catch (error) {
    console.error('❌ Error reprocessing Sinhala posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

reprocessSinhalaPosts()