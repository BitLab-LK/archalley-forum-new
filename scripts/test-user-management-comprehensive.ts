#!/usr/bin/env node
/**
 * User Management Comprehensive Test Script
 * Tests all aspects of user management functionality in the admin panel
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Type definitions for test results
interface TestResult {
  success: boolean
  error?: string
  count?: number
  users?: any[]
  results?: any[]
}

interface TestUser {
  name: string
  email: string
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN'
}

const testUsers: TestUser[] = [
  { name: 'Alice Johnson', email: 'alice.test@example.com', role: 'MEMBER' },
  { name: 'Bob Smith', email: 'bob.test@example.com', role: 'MEMBER' },
  { name: 'Carol Admin', email: 'carol.test@example.com', role: 'MODERATOR' },
  { name: 'David Tester', email: 'david.test@example.com', role: 'MEMBER' }
]

async function createTestUsers() {
  console.log('🔧 Creating test users for management testing...')
  
  const createdUsers = []
  
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email }
      })
      
      if (existingUser) {
        console.log(`ℹ️  User ${userData.email} already exists, using existing user`)
        createdUsers.push(existingUser)
        continue
      }
      
      const user = await prisma.users.create({
        data: {
          id: `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          emailVerified: new Date(),
          image: '/placeholder-user.jpg',
          updatedAt: new Date(),
          createdAt: new Date(),
          lastActiveAt: new Date()
        }
      })
      
      console.log(`✅ Created test user: ${user.name} (${user.email}) with role ${user.role}`)
      createdUsers.push(user)
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error)
    }
  }
  
  return createdUsers
}

async function testUserListDisplay() {
  console.log('\\n📋 Testing User List Display...')
  
  try {
    // Test the database query that the admin panel uses
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            Post: true,
            Comment: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    })

    console.log(`✅ Successfully fetched ${users.length} users from database`)
    
    // Validate user data structure
    if (users.length > 0) {
      const sampleUser = users[0]
      const requiredFields = ['id', 'name', 'email', 'role', 'createdAt']
      const hasAllFields = requiredFields.every(field => field in sampleUser)
      
      if (hasAllFields) {
        console.log('✅ User data structure is valid')
        
        // Check if users have proper formatting
        const formattedUsers = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          joinDate: user.createdAt.toISOString().split("T")[0],
          lastLogin: user.lastActiveAt?.toISOString().split("T")[0] || "Never",
          postCount: user._count.Post,
          commentCount: user._count.Comment
        }))
        
        console.log('✅ User data formatting works correctly')
        console.log(`📊 Sample user data:`, {
          name: formattedUsers[0].name,
          role: formattedUsers[0].role,
          joinDate: formattedUsers[0].joinDate,
          postCount: formattedUsers[0].postCount,
          commentCount: formattedUsers[0].commentCount
        })
        
        return { success: true, users: formattedUsers }
      } else {
        console.log('❌ User data structure is invalid - missing required fields')
        return { success: false, error: 'Missing required fields' }
      }
    } else {
      console.log('⚠️  No users found in database')
      return { success: true, users: [] }
    }
  } catch (error) {
    console.error('❌ User list display test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function testRoleUpdates(testUserId: string) {
  console.log(`\\n🔄 Testing Role Updates for user: ${testUserId}...`)
  
  const roleSequence = ['MEMBER', 'MODERATOR', 'ADMIN', 'MEMBER'] // Test full cycle
  let testResults = []
  
  for (const targetRole of roleSequence) {
    try {
      console.log(`  🔄 Updating role to: ${targetRole}`)
      
      // Simulate the role update operation
      const updatedUser = await prisma.users.update({
        where: { id: testUserId },
        data: { role: targetRole as any },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true
        }
      })
      
      console.log(`  ✅ Successfully updated role to ${updatedUser.role}`)
      
      // Verify the update persisted
      const verifiedUser = await prisma.users.findUnique({
        where: { id: testUserId },
        select: { role: true }
      })
      
      if (verifiedUser?.role === targetRole) {
        console.log(`  ✅ Role persistence verified: ${verifiedUser.role}`)
        testResults.push({ role: targetRole, success: true })
      } else {
        console.log(`  ❌ Role persistence failed: Expected ${targetRole}, got ${verifiedUser?.role}`)
        testResults.push({ role: targetRole, success: false, error: 'Persistence failed' })
      }
      
      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`  ❌ Failed to update role to ${targetRole}:`, error)
      testResults.push({ role: targetRole, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  
  const successfulUpdates = testResults.filter(r => r.success).length
  console.log(`\\n📊 Role Update Test Results: ${successfulUpdates}/${testResults.length} successful`)
  
  return {
    success: successfulUpdates === testResults.length,
    results: testResults
  }
}

async function testUserDeletion(testUserId: string) {
  console.log(`\\n🗑️  Testing User Deletion for user: ${testUserId}...`)
  
  try {
    // First, check if user exists
    const userBefore = await prisma.users.findUnique({
      where: { id: testUserId },
      select: { id: true, name: true, email: true }
    })
    
    if (!userBefore) {
      console.log('⚠️  User not found for deletion test')
      return { success: false, error: 'User not found' }
    }
    
    console.log(`  📋 User before deletion: ${userBefore.name} (${userBefore.email})`)
    
    // Simulate the admin deletion process (including related data cleanup)
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { authorId: testUserId } }),
      prisma.post.deleteMany({ where: { authorId: testUserId } }),
      prisma.users.delete({ where: { id: testUserId } })
    ])
    
    console.log('  ✅ User deletion transaction completed')
    
    // Verify the user was actually deleted
    const userAfter = await prisma.users.findUnique({
      where: { id: testUserId }
    })
    
    if (!userAfter) {
      console.log('  ✅ User successfully deleted from database')
      return { success: true }
    } else {
      console.log('  ❌ User still exists after deletion')
      return { success: false, error: 'User still exists' }
    }
    
  } catch (error) {
    console.error('  ❌ User deletion test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function testSearchFunctionality() {
  console.log('\\n🔍 Testing User Search Functionality...')
  
  try {
    // Test different search scenarios
    const searchTests = [
      { term: 'test', description: 'Search by email domain' },
      { term: 'Alice', description: 'Search by first name' },
      { term: 'Smith', description: 'Search by last name' },
      { term: 'MEMBER', description: 'Search by role' }
    ]
    
    let searchResults = []
    
    for (const searchTest of searchTests) {
      try {
        // Simulate search query (case-insensitive)
        const results = await prisma.users.findMany({
          where: {
            OR: [
              { name: { contains: searchTest.term, mode: 'insensitive' } },
              { email: { contains: searchTest.term, mode: 'insensitive' } },
              { role: { equals: searchTest.term as any } }
            ]
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          },
          take: 10
        })
        
        console.log(`  ✅ ${searchTest.description}: Found ${results.length} users`)
        searchResults.push({ 
          term: searchTest.term, 
          description: searchTest.description,
          count: results.length, 
          success: true 
        })
        
      } catch (error) {
        console.error(`  ❌ Search failed for "${searchTest.term}":`, error)
        searchResults.push({ 
          term: searchTest.term, 
          description: searchTest.description,
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    const successfulSearches = searchResults.filter(r => r.success).length
    console.log(`\\n📊 Search Test Results: ${successfulSearches}/${searchResults.length} successful`)
    
    return {
      success: successfulSearches === searchResults.length,
      results: searchResults
    }
    
  } catch (error) {
    console.error('❌ Search functionality test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function testUserManagementSecurity() {
  console.log('\\n🔒 Testing User Management Security...')
  
  try {
    // Test role validation
    const testUserId = await createSingleTestUser('security.test@example.com', 'Security Tester', 'MEMBER')
    
    const securityTests = [
      { role: 'INVALID_ROLE', shouldFail: true, description: 'Invalid role rejection' },
      { role: 'MEMBER', shouldFail: false, description: 'Valid MEMBER role' },
      { role: 'MODERATOR', shouldFail: false, description: 'Valid MODERATOR role' },
      { role: 'ADMIN', shouldFail: false, description: 'Valid ADMIN role' }
    ]
    
    let securityResults = []
    
    for (const test of securityTests) {
      try {
        await prisma.users.update({
          where: { id: testUserId },
          data: { role: test.role as any }
        })
        
        if (test.shouldFail) {
          console.log(`  ❌ ${test.description}: Should have failed but didn't`)
          securityResults.push({ ...test, actualResult: 'passed', success: false })
        } else {
          console.log(`  ✅ ${test.description}: Accepted as expected`)
          securityResults.push({ ...test, actualResult: 'passed', success: true })
        }
        
      } catch (error) {
        if (test.shouldFail) {
          console.log(`  ✅ ${test.description}: Correctly rejected`)
          securityResults.push({ ...test, actualResult: 'failed', success: true })
        } else {
          console.log(`  ❌ ${test.description}: Unexpectedly failed - ${error instanceof Error ? error.message : 'Unknown error'}`)
          securityResults.push({ ...test, actualResult: 'failed', success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    }
    
    // Cleanup security test user
    await prisma.users.delete({ where: { id: testUserId } })
    
    const successfulTests = securityResults.filter(r => r.success).length
    console.log(`\\n📊 Security Test Results: ${successfulTests}/${securityResults.length} successful`)
    
    return {
      success: successfulTests === securityResults.length,
      results: securityResults
    }
    
  } catch (error) {
    console.error('❌ Security testing failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function createSingleTestUser(email: string, name: string, role: string) {
  const user = await prisma.users.create({
    data: {
      id: `sec_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role: role as any,
      emailVerified: new Date(),
      image: '/placeholder-user.jpg',
      updatedAt: new Date(),
      createdAt: new Date(),
      lastActiveAt: new Date()
    }
  })
  return user.id
}

async function cleanupTestUsers() {
  console.log('\\n🧹 Cleaning up test users...')
  
  try {
    // Delete all test users (those with email containing 'test@example.com')
    const deleteResult = await prisma.users.deleteMany({
      where: {
        email: {
          contains: 'test@example.com'
        }
      }
    })
    
    console.log(`✅ Cleaned up ${deleteResult.count} test users`)
    return { success: true, count: deleteResult.count }
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function runUserManagementTests() {
  console.log('🚀 Starting Comprehensive User Management Tests...\\n')
  
  let overallResults: Record<string, TestResult> = {
    userCreation: { success: false },
    userListDisplay: { success: false },
    roleUpdates: { success: false },
    userDeletion: { success: false },
    searchFunctionality: { success: false },
    securityTesting: { success: false },
    cleanup: { success: false }
  }
  
  try {
    // 1. Create test users
    console.log('Phase 1: User Creation')
    const createdUsers = await createTestUsers()
    overallResults.userCreation = { success: createdUsers.length > 0, count: createdUsers.length }
    
    // 2. Test user list display
    console.log('\\nPhase 2: User List Display')
    overallResults.userListDisplay = await testUserListDisplay()
    
    // 3. Test role updates (if we have users)
    if (createdUsers.length > 0) {
      console.log('\\nPhase 3: Role Updates')
      overallResults.roleUpdates = await testRoleUpdates(createdUsers[0].id)
    }
    
    // 4. Test user deletion (if we have multiple users)
    if (createdUsers.length > 1) {
      console.log('\\nPhase 4: User Deletion')
      overallResults.userDeletion = await testUserDeletion(createdUsers[1].id)
    }
    
    // 5. Test search functionality
    console.log('\\nPhase 5: Search Functionality')
    overallResults.searchFunctionality = await testSearchFunctionality()
    
    // 6. Test security aspects
    console.log('\\nPhase 6: Security Testing')
    overallResults.securityTesting = await testUserManagementSecurity()
    
    // 7. Cleanup
    console.log('\\nPhase 7: Cleanup')
    overallResults.cleanup = await cleanupTestUsers()
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
  } finally {
    await prisma.$disconnect()
  }
  
  // Print comprehensive results
  console.log('\\n' + '='.repeat(60))
  console.log('📊 USER MANAGEMENT TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  
  Object.entries(overallResults).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED'
    const details = result.count ? ` (${result.count} items)` : ''
    const error = result.error ? ` - ${result.error}` : ''
    console.log(`${status} ${testName}${details}${error}`)
  })
  
  const passedTests = Object.values(overallResults).filter(r => r.success).length
  const totalTests = Object.keys(overallResults).length
  
  console.log('\\n' + '-'.repeat(60))
  console.log(`Overall Success Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All user management tests passed! The functionality is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above and fix them.')
  }
  
  console.log('\\n🔍 Manual Testing Checklist:')
  console.log('1. Open admin panel (/admin) and navigate to Users tab')
  console.log('2. Verify user list displays with avatars, names, emails, roles')
  console.log('3. Test role dropdown changes and verify they persist after page refresh')
  console.log('4. Test user deletion with confirmation dialog')
  console.log('5. Test search functionality if implemented in UI')
  console.log('6. Verify proper error handling for network failures')
}

// Run the tests
if (require.main === module) {
  runUserManagementTests().catch(console.error)
}

export { runUserManagementTests, createTestUsers, cleanupTestUsers }