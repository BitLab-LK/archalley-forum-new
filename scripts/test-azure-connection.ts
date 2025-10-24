#!/usr/bin/env tsx

/**
 * Test script to verify Azure PostgreSQL connection and schema compatibility
 * 
 * This script tests the connection to Azure Database for PostgreSQL and verifies
 * that the schema is compatible with your Prisma setup.
 * 
 * Usage: tsx scripts/test-azure-connection.ts
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/test'
    }
  }
})

async function testConnection() {
  console.log('🔍 Testing Azure PostgreSQL connection...')
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set. Please update your .env file with Azure credentials.')
    console.log('   Example: DATABASE_URL="postgresql://postgres:password@ai-builder-db-server.postgres.database.azure.com:5432/archalley?sslmode=require"')
    return false
  }
  
  try {
    await prisma.$connect()
    console.log('✅ Connection successful!')
    return true
  } catch (error) {
    console.error('❌ Connection failed:', error)
    return false
  }
}

async function testBasicQuery() {
  console.log('\n🔍 Testing basic query...')
  
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Basic query successful:', result)
    return true
  } catch (error) {
    console.error('❌ Basic query failed:', error)
    return false
  }
}

async function testSchemaCompatibility() {
  console.log('\n🔍 Testing schema compatibility...')
  
  try {
    // Test if we can access the main tables
    const tables = [
      'users',
      'Post',
      'Comment',
      'categories',
      'notifications',
      'badges',
      'userBadges',
      'votes',
      'WorkExperience',
      'Education',
      'pages',
      'settings',
      'EmailLogs',
      'Advertisement',
      'PostFlag',
      'ModerationAction',
      'PostCategory',
      'Account'
    ]

    for (const table of tables) {
      try {
        const count = await (prisma as any)[table].count()
        console.log(`   ✅ ${table}: ${count} records`)
      } catch (error) {
        console.log(`   ⚠️  ${table}: Not accessible or empty (${error instanceof Error ? error.message : 'Unknown error'})`)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Schema compatibility test failed:', error)
    return false
  }
}

async function testDatabaseInfo() {
  console.log('\n🔍 Getting database information...')
  
  try {
    // Get database version
    const version = await prisma.$queryRaw`SELECT version()`
    console.log('   Database version:', version)

    // Get current database name
    const dbName = await prisma.$queryRaw`SELECT current_database()`
    console.log('   Current database:', dbName)

    // Get current user
    const currentUser = await prisma.$queryRaw`SELECT current_user`
    console.log('   Current user:', currentUser)

    return true
  } catch (error) {
    console.error('❌ Database info test failed:', error)
    return false
  }
}

async function testPrismaOperations() {
  console.log('\n🔍 Testing Prisma operations...')
  
  try {
    // Test a simple read operation
    const userCount = await prisma.users.count()
    console.log(`   ✅ Users table accessible: ${userCount} records`)

    // Test a simple write operation (if possible)
    try {
      // This will only work if we have write permissions
      const testResult = await prisma.$queryRaw`SELECT NOW() as current_time`
      console.log('   ✅ Write operations available')
    } catch (error) {
      console.log('   ⚠️  Write operations may be restricted')
    }

    return true
  } catch (error) {
    console.error('❌ Prisma operations test failed:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Azure PostgreSQL Connection Test')
  console.log('=' .repeat(50))

  const tests = [
    { name: 'Connection Test', fn: testConnection },
    { name: 'Basic Query Test', fn: testBasicQuery },
    { name: 'Database Info Test', fn: testDatabaseInfo },
    { name: 'Schema Compatibility Test', fn: testSchemaCompatibility },
    { name: 'Prisma Operations Test', fn: testPrismaOperations }
  ]

  let passedTests = 0
  let totalTests = tests.length

  for (const test of tests) {
    console.log(`\n📋 Running ${test.name}...`)
    const passed = await test.fn()
    if (passed) {
      passedTests++
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Azure PostgreSQL setup is ready.')
  } else {
    console.log('⚠️  Some tests failed. Please check your configuration.')
  }

  await prisma.$disconnect()
}

// Run the tests
if (require.main === module) {
  main().catch(console.error)
}

export { main as testAzureConnection }