import { prisma } from '../lib/prisma'

async function addDataForUser() {
  try {
    const userId = '430cf6d5-b4b2-4ccb-95f6-52ef48c1efa9' // Your manual signup user ID
    
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        workExperience: true,
        education: true,
      }
    })

    if (!user) {
      console.log('User not found')
      return
    }

    console.log(`User: ${user.name} (${user.email})`)
    console.log(`Current work experience: ${user.workExperience.length}`)
    console.log(`Current education: ${user.education.length}`)

    // Add work experience if none exists
    if (user.workExperience.length === 0) {
      await prisma.workExperience.create({
        data: {
          userId: userId,
          jobTitle: 'Software Developer',
          company: 'Tech Company',
          startDate: new Date('2022-01-01'),
          endDate: null,
          isCurrent: true,
          description: 'Working on web applications and mobile apps.',
        }
      })
      console.log('Added work experience')
    }

    // Add education if none exists
    if (user.education.length === 0) {
      await prisma.education.create({
        data: {
          userId: userId,
          degree: 'Bachelor of Computer Science',
          institution: 'University of Technology',
          startDate: new Date('2018-09-01'),
          endDate: new Date('2022-05-31'),
          isCurrent: false,
          description: 'Studied computer science with focus on software engineering.',
        }
      })
      console.log('Added education')
    }

    console.log('Data added successfully!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDataForUser()
