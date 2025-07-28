const { PrismaClient } = require('@prisma/client')

async function checkDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    console.log('🔍 Checking categories...')
    const categories = await prisma.categories.findMany()
    console.log('📋 Available categories:', categories.map(c => ({ id: c.id, name: c.name })))
    
    if (categories.length === 0) {
      console.log('⚠️ No categories found. Creating a test category...')
      const testCategory = await prisma.categories.create({
        data: {
          id: 'test-category',
          name: 'Test Category',
          description: 'Test category for debugging',
          postCount: 0
        }
      })
      console.log('✅ Test category created:', testCategory)
    }
    
    console.log('🔍 Checking users...')
    const userCount = await prisma.users.count()
    console.log(`👥 Users in database: ${userCount}`)
    
    console.log('🔍 Checking posts...')
    const postCount = await prisma.post.count()
    console.log(`📝 Posts in database: ${postCount}`)
    
    console.log('🔍 Checking attachments...')
    const attachmentCount = await prisma.attachments.count()
    console.log(`📎 Attachments in database: ${attachmentCount}`)
    
  } catch (error) {
    console.error('❌ Database check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
