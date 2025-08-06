import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function addProfileData() {
  try {
    console.log('Adding profile data...')
    
    // Get the first user to update
    const user = await prisma.users.findFirst()
    
    if (!user) {
      console.log('No users found')
      return
    }
    
    console.log(`Updating user: ${user.email}`)
    
    // Update user with comprehensive profile data
    await prisma.users.update({
      where: { id: user.id },
      data: {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Passionate software developer with 5+ years of experience in web development. Love building user-friendly applications and contributing to open source projects.',
        phoneNumber: '+1 (555) 123-4567',
        city: 'San Francisco',
        country: 'United States',
        headline: 'Senior Software Engineer at Tech Corp',
        industry: 'Technology',
        portfolioUrl: 'https://johndoe.dev',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        twitterUrl: 'https://twitter.com/johndoe',
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Python']
      }
    })
    
    // Add work experience
    await prisma.workExperience.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        company: 'Tech Corp',
        jobTitle: 'Senior Software Engineer',
        startDate: new Date('2022-01-01'),
        endDate: null,
        isCurrent: true,
        description: 'Leading development of scalable web applications using React and Node.js. Mentoring junior developers and implementing best practices.',
        updatedAt: new Date()
      }
    })
    
    await prisma.workExperience.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        company: 'StartupXYZ',
        jobTitle: 'Full Stack Developer',
        startDate: new Date('2020-06-01'),
        endDate: new Date('2021-12-31'),
        isCurrent: false,
        description: 'Developed and maintained multiple client projects using modern web technologies. Collaborated with design team to implement responsive UI/UX.',
        updatedAt: new Date()
      }
    })
    
    // Add education
    await prisma.education.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science in Computer Science',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-31'),
        isCurrent: false,
        description: 'Focused on software engineering and algorithms. Graduated Magna Cum Laude with a 3.8 GPA.',
        updatedAt: new Date()
      }
    })
    
    console.log('Profile data added successfully!')
    
  } catch (error) {
    console.error('Error adding profile data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addProfileData()
