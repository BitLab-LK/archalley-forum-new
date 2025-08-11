import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Log all available models
console.log('Available Prisma models:', Object.keys(prisma))

// Export types for verification
export * from '@prisma/client'
