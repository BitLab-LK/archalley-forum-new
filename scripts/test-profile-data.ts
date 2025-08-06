import { prisma } from '../lib/prisma'

async function addTestProfileData() {
  try {
    // Get the first user
    const user = await prisma.users.findFirst()
    
    if (!user) {
      console.log('No users found in database')
      return
    }

    console.log(`Adding test data for user: ${user.name} (${user.id})`)

    // Add work experience
    await prisma.workExperience.create({
      data: {
        userId: user.id,
        jobTitle: 'Senior Software Developer',
        company: 'Tech Solutions Inc.',
        startDate: new Date('2022-01-01'),
        endDate: null,
        isCurrent: true,
        description: 'Leading development of web applications using React, Node.js, and TypeScript. Managing a team of 5 developers and implementing best practices for code quality and deployment.',
      }
    })

    await prisma.workExperience.create({
      data: {
        userId: user.id,
        jobTitle: 'Frontend Developer',
        company: 'Digital Agency',
        startDate: new Date('2020-06-01'),
        endDate: new Date('2021-12-31'),
        isCurrent: false,
        description: 'Developed responsive web applications and landing pages for various clients. Specialized in React, Vue.js, and modern CSS frameworks.',
      }
    })

    // Add education
    await prisma.education.create({
      data: {
        userId: user.id,
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Technology',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-31'),
        isCurrent: false,
        description: 'Graduated with honors. Focused on software engineering, algorithms, and data structures. Participated in various coding competitions and hackathons.',
      }
    })

    await prisma.education.create({
      data: {
        userId: user.id,
        degree: 'Master of Science in Software Engineering',
        institution: 'Tech University',
        startDate: new Date('2020-09-01'),
        endDate: null,
        isCurrent: true,
        description: 'Currently pursuing advanced studies in software architecture, machine learning, and distributed systems.',
      }
    })

    console.log('Test profile data added successfully!')

    // Verify the data
    const updatedUser = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        workExperience: {
          orderBy: { startDate: 'desc' }
        },
        education: {
          orderBy: { startDate: 'desc' }
        }
      }
    })

    console.log(`User now has ${updatedUser?.workExperience.length} work experiences and ${updatedUser?.education.length} education records`)
    
  } catch (error) {
    console.error('Error adding test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestProfileData()
