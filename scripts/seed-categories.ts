import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const predefinedCategories = [
  {
    id: 'business',
    name: 'Business',
    color: '#059669', // Green
    slug: 'business'
  },
  {
    id: 'design',
    name: 'Design',
    color: '#7C3AED', // Purple
    slug: 'design'
  },
  {
    id: 'informative',
    name: 'Informative',
    color: '#0D9488', // Teal
    slug: 'informative'
  },
  {
    id: 'career',
    name: 'Career',
    color: '#0EA5E9', // Blue
    slug: 'career'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    color: '#DC2626', // Red
    slug: 'jobs'
  },
  {
    id: 'construction',
    name: 'Construction',
    color: '#EA580C', // Orange
    slug: 'construction'
  },
  {
    id: 'academic',
    name: 'Academic',
    color: '#7C2D12', // Brown
    slug: 'academic'
  },
  {
    id: 'other',
    name: 'Other',
    color: '#6B7280', // Gray
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
            color: category.color,
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
