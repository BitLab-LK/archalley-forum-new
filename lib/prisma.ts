import { PrismaClient } from "@prisma/client"

/**
 * Prisma Client Singleton Configuration
 * 
 * IMPORTANT: For production serverless deployments (especially on Vercel), consider using:
 * 1. Prisma Accelerate - Provides built-in connection pooling (recommended)
 *    https://www.prisma.io/docs/accelerate/getting-started
 *    Update DATABASE_URL to use the Accelerate URL
 * 
 * 2. PgBouncer - Connection pooler for PostgreSQL
 *    Configure PgBouncer between your app and PostgreSQL database
 * 
 * 3. Connection Pooling Service - Many hosting providers offer connection pooling
 *    (e.g., Supabase, Neon, PlanetScale)
 * 
 * Current configuration uses Prisma's internal connection pool, which works but may
 * hit connection limits under high concurrency in serverless environments.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma configuration with better connection handling for production
// Build-safe options: only pass datasources when URL is defined to avoid constructor validation errors

// Prisma connection pool configuration
// These settings control how many connections Prisma will open to the database
// Prisma manages connections automatically - no explicit pool configuration needed here
// For serverless environments, consider using Prisma Accelerate or a connection pooler (see docs above)
const prismaClientOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
}

// Add datasource configuration only if DATABASE_URL exists
const databaseUrl = process.env.DATABASE_URL;
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
  // Note: In Prisma, connections are managed automatically through the connection pool.
  // We only verify connectivity with a simple query rather than explicitly calling $connect()
  // which can cause connection pool exhaustion in serverless environments.
  
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
      
      // Test the connection with a simple query instead of $connect()
      // Prisma manages connections automatically, explicit $connect() can cause issues
      await prisma.$queryRaw`SELECT 1`
      
      isConnected = true
      connectionAttempts = 0
      console.log('✅ Database connection verified successfully', {
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

/**
 * Retry wrapper for Prisma queries to handle connection pool exhaustion
 * Automatically retries queries that fail due to connection errors (P2037)
 * 
 * @param queryFn - Function that returns a Prisma query promise
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @param retryDelay - Base delay between retries in milliseconds (default: 1000)
 * @returns The result of the query
 */
export async function withRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection pool exhaustion error
      // Prisma errors can have the code in different places depending on error type
      const errorCode = error?.code || error?.errorCode || error?.meta?.code;
      const errorMessage = error?.message || '';
      
      const isConnectionError = 
        errorCode === 'P2037' ||
        errorMessage.includes('too many connections') ||
        errorMessage.includes('connection slots') ||
        errorMessage.includes('remaining connection slots') ||
        errorMessage.includes('Too many database connections opened');
      
      // Only retry on connection errors and if we have retries left
      if (isConnectionError && attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`⚠️ Connection pool exhausted (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`, {
          errorCode,
          errorMessage: errorMessage.substring(0, 200), // Truncate long messages
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a connection error or we're out of retries, throw
      throw error;
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}
