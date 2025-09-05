import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const predefinedCategories = [
  {
    id: 'business',
    name: 'Business',
    description: 'Business discussions, strategies, and industry insights',
    color: '#059669',
    icon: '💼',
    slug: 'business'
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Architectural design, interior design, and creative concepts',
    color: '#7C3AED',
    icon: '🎨',
    slug: 'design'
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Career development, professional growth, and networking',
    color: '#0EA5E9',
    icon: '📈',
    slug: 'career'
  },
  {
    id: 'jobs',
    name: 'Jobs',
    description: 'Job postings, opportunities, and recruitment',
    color: '#DC2626',
    icon: '💼',
    slug: 'jobs'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Construction techniques, projects, and industry updates',
    color: '#EA580C',
    icon: '🏗️',
    slug: 'construction'
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Academic research, education, and learning resources',
    color: '#7C2D12',
    icon: '🎓',
    slug: 'academic'
  },
  {
    id: 'other',
    name: 'Other',
    description: 'General discussions and topics that don\'t fit other categories',
    color: '#6B7280',
    icon: '💬',
    slug: 'other'
  }
]

export async function POST() {
  try {
    console.log('🌱 Creating predefined categories...')
    
    const results = []
    
    for (const category of predefinedCategories) {
      try {
        const existingCategory = await prisma.categories.findUnique({
          where: { id: category.id }
        })

        if (existingCategory) {
          console.log(`✅ Category '${category.name}' already exists`)
          results.push({ ...category, status: 'exists' })
        } else {
          console.log(`🆕 Creating category '${category.name}'...`)
          const newCategory = await prisma.categories.create({
            data: {
              ...category,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          results.push({ ...newCategory, status: 'created' })
        }
      } catch (error) {
        console.error(`❌ Error with category '${category.name}':`, error)
        results.push({ ...category, status: 'error', error: String(error) })
      }
    }

    console.log('✅ Category creation completed!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Categories created successfully',
      results 
    })
  } catch (error) {
    console.error('❌ Error creating categories:', error)
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
