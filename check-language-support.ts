import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLanguageSupport() {
  try {
    console.log('📊 Checking post language support in database...\n')
    
    // Get recent posts with language info
    const posts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        originalLanguage: true,
        translatedContent: true,
        aiCategory: true,
        createdAt: true,
        users: {
          select: {
            name: true
          }
        }
      }
    })

    if (posts.length === 0) {
      console.log('🔍 No posts found in database')
      return
    }

    console.log(`✅ Found ${posts.length} posts:`)
    posts.forEach((post, index) => {
      console.log(`\n📝 Post ${index + 1}:`)
      console.log(`  - ID: ${post.id}`)
      console.log(`  - Author: ${post.users.name}`)
      console.log(`  - Original Language: ${post.originalLanguage}`)
      console.log(`  - Content: ${post.content.substring(0, 50)}...`)
      if (post.translatedContent && post.translatedContent !== post.content) {
        console.log(`  - Translated: ${post.translatedContent.substring(0, 50)}...`)
      }
      console.log(`  - AI Category: ${post.aiCategory || 'None'}`)
      console.log(`  - Created: ${post.createdAt.toISOString()}`)
    })

    // Check if we have posts in different languages
    const languageStats = posts.reduce((acc, post) => {
      acc[post.originalLanguage] = (acc[post.originalLanguage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📈 Language Statistics:')
    Object.entries(languageStats).forEach(([lang, count]) => {
      console.log(`  - ${lang}: ${count} post(s)`)
    })

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLanguageSupport()
