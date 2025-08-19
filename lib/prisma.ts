import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma configuration with better connection handling
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Connection monitoring
let isConnected = false
let connectionAttempts = 0
const maxConnectionAttempts = 3

export async function ensureDbConnection() {
  if (isConnected) return true
  
  for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
    try {
      await prisma.$connect()
      // Test the connection
      await prisma.$queryRaw`SELECT 1`
      isConnected = true
      connectionAttempts = 0
      console.log('✅ Database connected successfully')
      return true
    } catch (error) {
      console.warn(`🔄 Database connection attempt ${attempt}/${maxConnectionAttempts} failed:`, error)
      connectionAttempts = attempt
      
      if (attempt === maxConnectionAttempts) {
        console.error('❌ Failed to connect to database after all attempts')
        throw new Error(`Database connection failed after ${maxConnectionAttempts} attempts`)
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  return false
}

// Graceful disconnection
export async function disconnectDb() {
  try {
    await prisma.$disconnect()
    isConnected = false
    console.log('🔌 Database disconnected')
  } catch (error) {
    console.warn('⚠️ Error during database disconnection:', error)
  }
}

// Health check function
export async function checkDbHealth() {
  try {
    await ensureDbConnection()
    const result = await prisma.$queryRaw`SELECT 1 as health`
    return { status: 'healthy', result }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      attempts: connectionAttempts
    }
  }
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
