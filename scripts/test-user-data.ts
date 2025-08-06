import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testUserData() {
  try {
    console.log('Testing user data fetch...')
    
    // Get the first user
    const user = await prisma.users.findFirst({
      include: {
        workExperience: true,
        education: true
      }
    })
    
    if (user) {
      console.log('User found:', {
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        phone: user.phoneNumber,
        city: user.city,
        country: user.country,
        workExperience: user.workExperience?.length || 0,
        education: user.education?.length || 0
      })
    } else {
      console.log('No users found')
    }
    
  } catch (error) {
    console.error('Error testing user data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserData()
