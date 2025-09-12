require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const predefinedCategories = [
  {
    id: 'business',
    name: 'Business',
    description: 'Business discussions, strategies, and industry insights',
    color: '#059669', // Green
    icon: '💼',
    slug: 'business'
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Architectural design, interior design, and creative concepts',
    color: '#7C3AED', // Purple
    icon: '🎨',
    slug: 'design'
  },
  {
    id: 'informative',
    name: 'Informative',
    description: 'Educational content, tutorials, and informational resources',
    color: '#0D9488', // Teal
    icon: '📚',
    slug: 'informative'
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Career development, professional growth, and networking',
    color: '#0EA5E9', // Blue
    icon: '📈',
    slug: 'career'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    description: 'Job postings, opportunities, and recruitment',
    color: '#DC2626', // Red
    icon: '💼',
    slug: 'jobs'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Construction techniques, projects, and industry updates',
    color: '#EA580C', // Orange
    icon: '🏗️',
    slug: 'construction'
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Academic research, education, and learning resources',
    color: '#7C2D12', // Brown
    icon: '📚',
    slug: 'academic'
  },
  {
    id: 'other',
    name: 'Other',
    description: 'General discussions and miscellaneous topics',
    color: '#6B7280', // Gray
    icon: '💭',
    slug: 'other'
  }
]

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...')
    
    // Check if categories already exist
    const existingCategories = await prisma.categories.findMany()
    
    if (existingCategories.length > 0) {
      console.log(`✅ Found ${existingCategories.length} existing categories:`)
      existingCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.id})`)
      })
      return
    }
    
    // Create categories
    for (const category of predefinedCategories) {
      await prisma.categories.create({
        data: {
          ...category,
          postCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      console.log(`✅ Created category: ${category.name}`)
    }
    
    console.log(`\n🎉 Successfully seeded ${predefinedCategories.length} categories!`)
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()
