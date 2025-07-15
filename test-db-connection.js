const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
  
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Try a simple query
    const userCount = await prisma.user.count()
    console.log(`📊 Found ${userCount} users in database`)
    
  } catch (error) {
    console.log('❌ Database connection failed:')
    console.log('Error code:', error.code)
    console.log('Error message:', error.message)
    console.log('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
