const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCategoryCounts() {
  console.log('🔧 Fixing category post counts...')

  try {
    // Get all categories
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        postCount: true
      }
    })

    console.log('📊 Current categories and their stored post counts:')
    categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.postCount} posts (stored)`)
    })

    // Get actual post counts for each category
    console.log('\n🔍 Calculating actual post counts...')
    
    for (const category of categories) {
      // Count posts for this category (both primary and secondary assignments)
      const actualPostCount = await prisma.post.count({
        where: {
          OR: [
            { categoryId: category.id },
            { categoryIds: { has: category.id } }
          ]
        }
      })

      console.log(`  - ${category.name}: ${actualPostCount} posts (actual)`)

      // Update if counts don't match
      if (category.postCount !== actualPostCount) {
        console.log(`    ⚠️  Mismatch! Updating ${category.name} from ${category.postCount} to ${actualPostCount}`)
        
        await prisma.categories.update({
          where: { id: category.id },
          data: { postCount: actualPostCount }
        })
      } else {
        console.log(`    ✅ ${category.name} count is correct`)
      }
    }

    // Final verification
    console.log('\n✅ Final category post counts:')
    const updatedCategories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        postCount: true
      }
    })

    updatedCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.postCount} posts`)
    })

    console.log('\n🎉 Category post counts have been fixed!')

  } catch (error) {
    console.error('❌ Error fixing category counts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixCategoryCounts()