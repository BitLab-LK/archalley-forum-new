// Check specific posts in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPosts() {
  try {
    console.log('🔍 Checking recent posts...')
    
    const posts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        content: true, 
        categoryId: true, 
        categoryIds: true, 
        aiCategories: true,
        aiCategory: true,
        categories: {
          select: { name: true }
        }
      }
    })
    
    console.log('📊 Recent posts:')
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. Post: ${post.content.substring(0, 50)}...`)
      console.log(`   Primary category: ${post.categoryId} (${post.categories.name})`)
      console.log(`   Category IDs: [${post.categoryIds.join(', ')}]`)
      console.log(`   AI Categories: [${post.aiCategories.join(', ')}]`)
      console.log(`   AI Category: ${post.aiCategory}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPosts()