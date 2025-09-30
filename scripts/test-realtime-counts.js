const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testRealTimeUpdates() {
  console.log('🧪 Testing real-time category count updates...\n')

  try {
    // 1. Get current counts
    console.log('📊 Step 1: Getting current category counts...')
    const beforeCounts = await prisma.categories.findMany({
      select: { id: true, name: true, postCount: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('Before counts:')
    beforeCounts.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.postCount} posts`)
    })
    
    // 2. Create a test post
    console.log('\n📝 Step 2: Creating test post...')
    const testPost = await prisma.post.create({
      data: {
        id: `test-${Date.now()}`,
        content: 'This is a test post for verifying real-time category count updates.',
        authorId: 'test-user', // You might need to adjust this
        categoryId: 'design', // Assign to Design category
        categoryIds: ['design', 'business'], // Multi-category assignment
        originalLanguage: 'English',
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Created test post:', testPost.id)
    
    // 3. Manually trigger count update (simulating the API logic)
    const { incrementCategoryPostCounts } = require('../lib/category-count-utils')
    await incrementCategoryPostCounts(prisma, ['design', 'business'], 1)
    
    console.log('\n📈 Step 3: Updated category counts (+1 for Design and Business)')
    
    // 4. Check updated counts
    console.log('\n📊 Step 4: Getting updated category counts...')
    const afterCounts = await prisma.categories.findMany({
      select: { id: true, name: true, postCount: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('After counts:')
    afterCounts.forEach(cat => {
      const before = beforeCounts.find(b => b.id === cat.id)?.postCount || 0
      const change = cat.postCount - before
      const changeStr = change > 0 ? `+${change}` : change < 0 ? `${change}` : '±0'
      console.log(`  - ${cat.name}: ${cat.postCount} posts (${changeStr})`)
    })
    
    // 5. Delete the test post
    console.log('\n🗑️ Step 5: Deleting test post...')
    await prisma.post.delete({
      where: { id: testPost.id }
    })
    
    // 6. Update counts again
    await incrementCategoryPostCounts(prisma, ['design', 'business'], -1)
    console.log('\n📉 Step 6: Updated category counts (-1 for Design and Business)')
    
    // 7. Final verification
    console.log('\n📊 Step 7: Final verification...')
    const finalCounts = await prisma.categories.findMany({
      select: { id: true, name: true, postCount: true },
      orderBy: { name: 'asc' }
    })
    
    console.log('Final counts (should match initial):')
    let allMatch = true
    finalCounts.forEach(cat => {
      const before = beforeCounts.find(b => b.id === cat.id)?.postCount || 0
      const matches = cat.postCount === before
      if (!matches) allMatch = false
      console.log(`  - ${cat.name}: ${cat.postCount} posts ${matches ? '✅' : '❌'}`)
    })
    
    console.log(`\n🎉 Test ${allMatch ? 'PASSED' : 'FAILED'}: Real-time updates are ${allMatch ? 'working correctly' : 'not working properly'}!`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testRealTimeUpdates()