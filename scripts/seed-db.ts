import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('Starting database seeding...')

    // Clear existing data
    console.log('Clearing existing data...')
    await prisma.$transaction([
      prisma.post.deleteMany(),
      prisma.users.deleteMany(),
      prisma.categories.deleteMany(),
    ])

    // Create categories
    console.log('Creating categories...')
    const categories = await Promise.all([
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Business',
          description: 'Discuss business strategies, entrepreneurship, and industry trends in architecture and construction.',
          color: 'bg-blue-500',
          icon: 'Briefcase',
          slug: 'business',
        },
      }),
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Design',
          description: 'Share and discuss architectural designs, concepts, and creative inspiration.',
          color: 'bg-purple-500',
          icon: 'Palette',
          slug: 'design',
        },
      }),
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Career',
          description: 'Career advice, job opportunities, and professional development in the industry.',
          color: 'bg-green-500',
          icon: 'GraduationCap',
          slug: 'career',
        },
      }),
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Construction',
          description: 'Construction techniques, materials, project management, and industry innovations.',
          color: 'bg-yellow-500',
          icon: 'HardHat',
          slug: 'construction',
        },
      }),
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Academic',
          description: 'Academic discussions, research, theories, and educational resources.',
          color: 'bg-indigo-500',
          icon: 'BookOpen',
          slug: 'academic',
        },
      }),
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Informative',
          description: 'News, updates, tutorials, and informational content about the industry.',
          color: 'bg-cyan-500',
          icon: 'Info',
          slug: 'informative',
        },
      }),
      prisma.categories.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Other',
          description: 'General discussions and topics that don\'t fit into other categories.',
          color: 'bg-gray-500',
          icon: 'MoreHorizontal',
          slug: 'other',
        },
      }),
    ])

    console.log('Categories created:', categories.length)

    // Create admin user
    console.log('Creating admin user...')
    const adminPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        name: 'Admin User',
        email: 'admin@archalley.com',
        password: adminPassword,
        role: UserRole.ADMIN,
        isVerified: true,
        company: 'Archalley',
        profession: 'Administrator',
        bio: 'Forum administrator and community manager.',
      },
    })

    console.log('Admin user created:', adminUser.email)

    // Create sample users
    console.log('Creating sample users...')
    const userPassword = await bcrypt.hash('password123', 12)
    const users = await Promise.all([
      prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Sarah Chen',
          email: 'sarah@example.com',
          password: userPassword,
          role: UserRole.MEMBER,
          isVerified: true,
          company: 'Chen Design Studio',
          profession: 'Architect',
          bio: 'Passionate architect with 10+ years of experience in sustainable design.',
          location: 'San Francisco, CA',
        },
      }),
      prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          name: 'Mike Johnson',
          email: 'mike@example.com',
          password: userPassword,
          role: UserRole.MODERATOR,
          isVerified: true,
          company: 'Johnson Interiors',
          profession: 'Interior Designer',
          bio: 'Interior designer specializing in modern commercial spaces.',
          location: 'New York, NY',
        },
      }),
    ])

    console.log('Sample users created:', users.length)

    // Create sample posts
    console.log('Creating sample posts...')
    const posts = await Promise.all([
      prisma.post.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          content: 'Just finished designing a sustainable office complex in downtown. The integration of green walls and natural lighting has been incredible. What are your thoughts on biophilic design in modern architecture?',
          authorId: users[0].id,
          categoryId: categories[1].id, // Design
          isAnonymous: false,
        },
      }),
      prisma.post.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          content: 'Need the service of a good architect for a proposed house in Mathugama',
          authorId: users[1].id,
          categoryId: categories[0].id, // Business
          isAnonymous: true,
        },
      }),
    ])

    console.log('Sample posts created:', posts.length)
    console.log('Database seeding completed successfully!')

  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
seedDatabase()
  .catch((error) => {
    console.error('Failed to seed database:', error)
    process.exit(1)
  }) 