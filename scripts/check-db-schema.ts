import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchema() {
  try {
    console.log('Checking database schema...')
    
    // Check if we can query users table
    const users = await prisma.users.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        phone: true,
        city: true,
        country: true,
        education: true,
        workExperience: true,
      }
    })
    
    console.log('Users table structure check:', users)
    
    // Check WorkExperience table
    const workExp = await prisma.workExperience.findMany({
      take: 1
    })
    
    console.log('WorkExperience table check:', workExp)
    
    // Check Education table
    const education = await prisma.education.findMany({
      take: 1
    })
    
    console.log('Education table check:', education)
    
  } catch (error) {
    console.error('Database schema check error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
