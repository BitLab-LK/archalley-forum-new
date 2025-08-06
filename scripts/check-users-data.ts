import { prisma } from '../lib/prisma'

async function checkUsersData() {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            workExperience: true,
            education: true,
          }
        }
      }
    })

    console.log('Users and their data counts:')
    users.forEach(user => {
      console.log(`${user.name} (${user.email}): ${user._count.workExperience} work experiences, ${user._count.education} education records`)
    })

    // Check detailed data for first user with data
    const userWithData = await prisma.users.findFirst({
      include: {
        workExperience: true,
        education: true,
      }
    })

    if (userWithData) {
      console.log('\nDetailed data for first user:')
      console.log('Work Experience:', userWithData.workExperience)
      console.log('Education:', userWithData.education)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsersData()
