import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma configuration with better connection handling for production
// Build-safe options: only pass datasources when URL is defined to avoid constructor validation errors

// Configure connection pool to prevent exhausting database connections
// Parse DATABASE_URL and add connection pool parameters if not present
let databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl && !databaseUrl.includes('connection_limit')) {
  // Add connection pool parameters to prevent connection exhaustion
  // connection_limit: Maximum number of connections in the pool (default: number of CPU cores * 2 + 1)
  // pool_timeout: Maximum time (in seconds) to wait for a connection (default: 10)
  // For serverless/edge environments, use a smaller pool size
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const connectionLimit = isServerless ? 5 : 10; // Smaller pool for serverless
  const poolTimeout = 20; // 20 seconds timeout
  
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl = `${databaseUrl}${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
}

const prismaClientOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
}

if (databaseUrl) {
  prismaClientOptions.datasources = {
    db: { url: databaseUrl },
  }
}

// Always reuse a single PrismaClient instance (including production) to avoid
// exhausting database connections in serverless/edge environments.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

// Connection monitoring with improved retry logic
let isConnected = false
let connectionAttempts = 0
const maxConnectionAttempts = 5 // Increased attempts
let lastConnectionAttempt = 0
const connectionRetryDelay = 2000 // 2 seconds

export async function ensureDbConnection() {
  // If we recently attempted connection and failed, don't retry immediately
  const now = Date.now()
  if (connectionAttempts >= maxConnectionAttempts && (now - lastConnectionAttempt) < connectionRetryDelay) {
    throw new Error(`Database connection failed. Last attempt: ${new Date(lastConnectionAttempt).toISOString()}`)
  }
  
  if (isConnected) return true
  
  // Reset attempts if enough time has passed
  if ((now - lastConnectionAttempt) > 30000) { // 30 seconds
    connectionAttempts = 0
  }
  
  for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
    try {
      lastConnectionAttempt = now
      await prisma.$connect()
      
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1`
      
      isConnected = true
      connectionAttempts = 0
      console.log('✅ Database connected successfully', {
        attempt,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      })
      return true
    } catch (error) {
      console.warn(`🔄 Database connection attempt ${attempt}/${maxConnectionAttempts} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      })
      connectionAttempts = attempt
      
      if (attempt === maxConnectionAttempts) {
        console.error('❌ Failed to connect to database after all attempts', {
          attempts: maxConnectionAttempts,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
        throw new Error(`Database connection failed after ${maxConnectionAttempts} attempts. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
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

// Cache the client globally so it persists across hot reloads and lambda invocations.
globalForPrisma.prisma = prisma
