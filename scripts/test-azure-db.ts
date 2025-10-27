/**
 * Test Azure PostgreSQL Database Connection
 * This script verifies the connection to Azure Database for PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing Azure PostgreSQL connection...\n');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');
    
    // Get database info
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    console.log('📊 Database Info:');
    console.log(result[0].version);
    console.log('');
    
    // Test table access
    const userCount = await prisma.users.count();
    console.log(`📈 Statistics:`);
    console.log(`   Users: ${userCount}`);
    
    const postCount = await prisma.post.count();
    console.log(`   Posts: ${postCount}`);
    
    const categoryCount = await prisma.categories.count();
    console.log(`   Categories: ${categoryCount}`);
    
    console.log('\n✨ All tests passed! Azure PostgreSQL is working correctly.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
