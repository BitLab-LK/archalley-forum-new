// Script to check current post categorizations
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPostCategorizations() {
  try {
    console.log('🔍 Checking current post categorizations...\n')
    
    // Get all posts with their categories
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        categoryIds: true,
        categoryId: true,
        createdAt: true,
        users: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Get latest 20 posts
    })
    
    // Get all categories for mapping
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        color: true
      }
    })
    
    // Create category mapping
    const categoryMap = {}
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name
    })
    
    console.log('📋 Available Categories:')
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`)
    })
    
    console.log('\n📝 Recent Posts and Their Categorizations:')
    console.log('=' * 60)
    
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. Post ID: ${post.id}`)
      console.log(`   Author: ${post.users?.name || 'Unknown'}`)
      console.log(`   Created: ${post.createdAt.toLocaleDateString()}`)
      
      // Show first 100 characters of content
      const contentPreview = post.content.length > 100 
        ? post.content.substring(0, 100) + '...'
        : post.content
      console.log(`   Content: "${contentPreview}"`)
      
      // Show assigned categories
      if (post.categoryIds && post.categoryIds.length > 0) {
        const assignedCategories = post.categoryIds.map(id => categoryMap[id] || `Unknown(${id})`)
        console.log(`   Categories: ${assignedCategories.join(', ')}`)
        
        // Analyze if categorization seems correct
        const content = post.content.toLowerCase()
        const categories = assignedCategories.map(cat => cat.toLowerCase())
        
        // Check for technology keywords
        const techKeywords = ['ai', 'artificial intelligence', 'software', 'programming', 'code', 'github', 'copilot', 'development', 'tech', 'automation', 'framework', 'api', 'javascript', 'python', 'react', 'node', 'database', 'machine learning', 'algorithm']
        const hasTechKeywords = techKeywords.some(keyword => content.includes(keyword))
        
        // Check for construction keywords  
        const constructionKeywords = ['building', 'construction', 'contractor', 'architecture', 'cement', 'concrete', 'excavation', 'foundation', 'plumbing', 'electrical']
        const hasConstructionKeywords = constructionKeywords.some(keyword => content.includes(keyword))
        
        // Check for career keywords
        const careerKeywords = ['job', 'career', 'hiring', 'interview', 'resume', 'salary', 'employment', 'work', 'position', 'opportunity']
        const hasCareerKeywords = careerKeywords.some(keyword => content.includes(keyword))
        
        // Analysis
        if (hasTechKeywords && !categories.includes('technology')) {
          console.log(`   ⚠️  POTENTIAL ISSUE: Contains tech keywords but not categorized as Technology`)
        }
        if (hasConstructionKeywords && !categories.includes('construction')) {
          console.log(`   ⚠️  POTENTIAL ISSUE: Contains construction keywords but not categorized as Construction`)
        }
        if (hasCareerKeywords && !categories.includes('career')) {
          console.log(`   ⚠️  POTENTIAL ISSUE: Contains career keywords but not categorized as Career`)
        }
        if (hasTechKeywords && categories.includes('construction')) {
          console.log(`   ❌ CATEGORIZATION ERROR: Tech content wrongly categorized as Construction`)
        }
        if (hasTechKeywords && categories.includes('technology')) {
          console.log(`   ✅ CORRECT: Tech content properly categorized as Technology`)
        }
      } else {
        console.log(`   Categories: None assigned`)
      }
    })
    
    console.log('\n📊 Summary:')
    const totalPosts = posts.length
    const techPosts = posts.filter(post => {
      const content = post.content.toLowerCase()
      return ['ai', 'artificial intelligence', 'software', 'programming', 'code', 'github', 'copilot', 'development', 'tech', 'automation', 'framework'].some(keyword => content.includes(keyword))
    })
    
    const correctlyTechCategorized = techPosts.filter(post => {
      const assignedCategories = post.categoryIds?.map(id => categoryMap[id]?.toLowerCase()) || []
      return assignedCategories.includes('technology')
    })
    
    console.log(`Total posts checked: ${totalPosts}`)
    console.log(`Posts with tech keywords: ${techPosts.length}`)
    console.log(`Tech posts correctly categorized: ${correctlyTechCategorized.length}`)
    
    if (techPosts.length > 0) {
      const accuracy = (correctlyTechCategorized.length / techPosts.length * 100).toFixed(1)
      console.log(`Tech categorization accuracy: ${accuracy}%`)
    }
    
  } catch (error) {
    console.error('❌ Error checking categorizations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPostCategorizations()
