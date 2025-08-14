import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Function to get database URL with fallback options
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  
  console.log(`Using database URL: ${databaseUrl.substring(0, 50)}...`)
  return databaseUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Enhanced test database connection function with retry logic
export async function testDatabaseConnection(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Testing database connection... (attempt ${attempt}/${retries})`)
      
      // Use a simple query to test the connection
      await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Database connected successfully')
      return true
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${attempt}/${retries}):`, 
        error instanceof Error ? error.message : error)
      
      // If this is a connection error and not the last attempt, wait before retrying
      if (attempt < retries && error instanceof Error && (
        error.message.includes("Can't reach database server") ||
        error.message.includes("connection") ||
        error.message.includes("P1001")
      )) {
        const waitTime = attempt * 2000 // 2s, 4s, 6s...
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else if (attempt === retries) {
        // On the last attempt, log additional debugging info
        console.error("Final attempt failed. Database details:")
        console.error("- URL starts with:", process.env.DATABASE_URL?.substring(0, 30))
        console.error("- Environment:", process.env.NODE_ENV)
        console.error("- Error type:", error instanceof Error ? error.constructor.name : typeof error)
      }
    }
  }
  
  return false
}

// Graceful shutdown with enhanced error handling
async function disconnectPrisma() {
  try {
    console.log("Disconnecting Prisma client...")
    await prisma.$disconnect()
    console.log("✅ Prisma client disconnected successfully")
  } catch (error) {
    console.error("❌ Error disconnecting Prisma:", error)
  }
}

process.on('beforeExit', async () => {
  await disconnectPrisma()
})

process.on('SIGINT', async () => {
  await disconnectPrisma()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectPrisma()
  process.exit(0)
})
