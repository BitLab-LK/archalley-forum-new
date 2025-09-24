#!/usr/bin/env node
/**
 * User Management Testing Script
 * Tests admin user operations including listing, role updates, and user deletion
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestUser {
  name: string
  email: string
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN'
}

const testUsers: TestUser[] = [
  { name: 'Test User 1', email: 'test1@example.com', role: 'MEMBER' },
  { name: 'Test User 2', email: 'test2@example.com', role: 'MEMBER' },
  { name: 'Test Moderator', email: 'mod@example.com', role: 'MODERATOR' }
]

async function createTestUsers() {
  console.log('🔧 Creating test users...')
  
  const createdUsers = []
  
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email }
      })
      
      if (existingUser) {
        console.log(`ℹ️  User ${userData.email} already exists, skipping creation`)
        createdUsers.push(existingUser)
        continue
      }
      
      const user = await prisma.users.create({
        data: {
          id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          emailVerified: new Date(),
          image: '/placeholder-user.jpg',
          updatedAt: new Date()
        }
      })
      
      console.log(`✅ Created user: ${user.name} (${user.email}) with role ${user.role}`)
      createdUsers.push(user)
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error)
    }
  }
  
  return createdUsers
}

async function testUserListingAPI() {
  console.log('\n📋 Testing User Listing API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real testing, you'd need proper session authentication
        'Cookie': 'next-auth.session-token=test-admin-session'
      }
    })
    
    if (!response.ok) {
      console.log(`⚠️  API Response Status: ${response.status}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return false
    }
    
    const data = await response.json()
    console.log(`✅ Successfully fetched ${data.users?.length || 0} users`)
    
    // Validate response structure
    if (data.users && Array.isArray(data.users)) {
      const sampleUser = data.users[0]
      if (sampleUser) {
        const requiredFields = ['id', 'name', 'email', 'role']
        const hasAllFields = requiredFields.every(field => field in sampleUser)
        
        if (hasAllFields) {
          console.log('✅ Response structure is valid')
          return true
        } else {
          console.log('❌ Response missing required fields')
          return false
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ API request failed:', error)
    return false
  }
}

async function testRoleUpdateAPI(userId: string, newRole: string) {
  console.log(`\n🔄 Testing Role Update API (User: ${userId}, New Role: ${newRole})...`)
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-admin-session'
      },
      body: JSON.stringify({
        userId,
        role: newRole
      })
    })
    
    if (!response.ok) {
      console.log(`⚠️  API Response Status: ${response.status}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return false
    }
    
    const data = await response.json()
    console.log('✅ Role update successful:', data.message)
    
    // Verify the role was actually updated in database
    const updatedUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, name: true }
    })
    
    if (updatedUser?.role === newRole) {
      console.log(`✅ Database verification: User role updated to ${newRole}`)
      return true
    } else {
      console.log(`❌ Database verification failed: Expected ${newRole}, got ${updatedUser?.role}`)
      return false
    }
  } catch (error) {
    console.error('❌ Role update API request failed:', error)
    return false
  }
}

async function testUserDeletionAPI(userId: string) {
  console.log(`\n🗑️  Testing User Deletion API (User: ${userId})...`)
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/users?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-admin-session'
      }
    })
    
    if (!response.ok) {
      console.log(`⚠️  API Response Status: ${response.status}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return false
    }
    
    const data = await response.json()
    console.log('✅ User deletion successful:', data.message)
    
    // Verify the user was actually deleted from database
    const deletedUser = await prisma.users.findUnique({
      where: { id: userId }
    })
    
    if (!deletedUser) {
      console.log('✅ Database verification: User successfully deleted')
      return true
    } else {
      console.log('❌ Database verification failed: User still exists')
      return false
    }
  } catch (error) {
    console.error('❌ User deletion API request failed:', error)
    return false
  }
}

async function testDatabaseQueries() {
  console.log('\n🗄️  Testing Database Queries...')
  
  try {
    // Test user listing query
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Post: true,
            Comment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`✅ Database query successful: Found ${users.length} users`)
    
    // Test role update query
    const testUser = users.find((u: any) => u.email.includes('test'))
    if (testUser) {
      await prisma.users.update({
        where: { id: testUser.id },
        data: { role: 'MODERATOR' }
      })
      console.log('✅ Role update query successful')
      
      // Revert the change
      await prisma.users.update({
        where: { id: testUser.id },
        data: { role: 'MEMBER' }
      })
      console.log('✅ Role revert successful')
    }
    
    return true
  } catch (error) {
    console.error('❌ Database query failed:', error)
    return false
  }
}

async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...')
  
  for (const userData of testUsers) {
    try {
      await prisma.users.deleteMany({
        where: { email: userData.email }
      })
      console.log(`✅ Cleaned up user: ${userData.email}`)
    } catch (error) {
      console.error(`❌ Failed to cleanup user ${userData.email}:`, error)
    }
  }
}

async function runTests() {
  console.log('🚀 Starting User Management Tests...\n')
  
  let testResults = {
    userCreation: false,
    databaseQueries: false,
    userListing: false,
    roleUpdate: false,
    userDeletion: false
  }
  
  try {
    // 1. Create test users
    const createdUsers = await createTestUsers()
    testResults.userCreation = createdUsers.length > 0
    
    // 2. Test database queries
    testResults.databaseQueries = await testDatabaseQueries()
    
    // 3. Test API endpoints (Note: These will fail without proper authentication)
    console.log('\n⚠️  Note: API tests require server to be running and proper authentication')
    testResults.userListing = await testUserListingAPI()
    
    if (createdUsers.length > 0) {
      testResults.roleUpdate = await testRoleUpdateAPI(createdUsers[0].id, 'MODERATOR')
      testResults.userDeletion = await testUserDeletionAPI(createdUsers[1]?.id || createdUsers[0].id)
    }
    
    // 4. Cleanup
    await cleanupTestUsers()
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
  } finally {
    await prisma.$disconnect()
  }
  
  // Print results
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`)
  })
  
  const passedTests = Object.values(testResults).filter(Boolean).length
  const totalTests = Object.keys(testResults).length
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! User management functionality is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.')
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error)
}

export { runTests, createTestUsers, cleanupTestUsers }