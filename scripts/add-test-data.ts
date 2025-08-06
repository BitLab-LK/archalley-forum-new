import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTestData() {
  try {
    console.log('Adding test data to existing users...')

    // Get all existing users
    const users = await prisma.users.findMany({
      select: { id: true, name: true, email: true }
    })

    console.log(`Found ${users.length} users to update`)

    for (const user of users) {
      // Update user with comprehensive profile data
      await prisma.users.update({
        where: { id: user.id },
        data: {
          firstName: user.name?.split(' ')[0] || 'John',
          lastName: user.name?.split(' ')[1] || 'Doe',
          phoneNumber: '+1-555-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
          headline: 'Senior Architect specializing in sustainable design',
          skills: ['Architecture', 'Sustainable Design', 'LEED Certification', 'Project Management', 'AutoCAD', 'Revit'],
          industry: 'Architecture & Construction',
          country: 'United States',
          city: 'San Francisco',
          portfolioUrl: 'https://michaelrodriguez.portfolio.com',
          linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
          facebookUrl: 'https://facebook.com/michaelrodriguez',
          instagramUrl: 'https://instagram.com/sustainable.architect',
          bio: 'Passionate architect with 15+ years of experience in sustainable commercial and residential design. Led over 50 successful projects with focus on LEED certification and green building practices.',
        }
      })

      // Add work experience
      await prisma.workExperience.create({
        data: {
          jobTitle: 'Senior Architect',
          company: 'Green Building Solutions',
          startDate: new Date('2020-01-15'),
          endDate: null,
          isCurrent: true,
          description: 'Leading sustainable architecture projects with focus on LEED certification and energy-efficient design solutions.',
          userId: user.id
        }
      })

      await prisma.workExperience.create({
        data: {
          jobTitle: 'Architect',
          company: 'Urban Design Studio',
          startDate: new Date('2015-06-01'),
          endDate: new Date('2019-12-31'),
          isCurrent: false,
          description: 'Designed residential and commercial buildings with emphasis on innovative and sustainable design practices.',
          userId: user.id
        }
      })

      // Add education
      await prisma.education.create({
        data: {
          degree: 'Master of Architecture',
          institution: 'University of California, Berkeley',
          startDate: new Date('2010-09-01'),
          endDate: new Date('2013-05-15'),
          isCurrent: false,
          description: 'Specialized in sustainable design and green building technologies.',
          userId: user.id
        }
      })

      await prisma.education.create({
        data: {
          degree: 'Bachelor of Science in Architecture',
          institution: 'California Polytechnic State University',
          startDate: new Date('2006-09-01'),
          endDate: new Date('2010-06-15'),
          isCurrent: false,
          description: 'Foundation in architectural design, structural engineering, and building systems.',
          userId: user.id
        }
      })

      console.log(`Updated user: ${user.name} (${user.email})`)
    }

    console.log('✅ Test data added successfully!')
  } catch (error) {
    console.error('Error adding test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestData()
