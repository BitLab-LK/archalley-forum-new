import { PrismaClient } from '@prisma/client'

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
    icon: '🎓',
    slug: 'academic'
  },
  {
    id: 'other',
    name: 'Other',
    description: 'General discussions and topics that don\'t fit other categories',
    color: '#6B7280', // Gray
    icon: '💬',
    slug: 'other'
  }
]

async function seedCategories() {
  console.log('🌱 Seeding predefined categories...')

  for (const category of predefinedCategories) {
    try {
      const existingCategory = await prisma.categories.findUnique({
        where: { id: category.id }
      })

      if (existingCategory) {
        console.log(`✅ Category '${category.name}' already exists, updating...`)
        await prisma.categories.update({
          where: { id: category.id },
          data: {
            name: category.name,
            description: category.description,
            color: category.color,
            icon: category.icon,
            slug: category.slug,
            updatedAt: new Date()
          }
        })
      } else {
        console.log(`🆕 Creating category '${category.name}'...`)
        await prisma.categories.create({
          data: {
            ...category,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error(`❌ Error creating/updating category '${category.name}':`, error)
    }
  }

  console.log('✅ Category seeding completed!')
}

async function main() {
  try {
    await seedCategories()
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export { seedCategories }
