// Test the AI classification service directly from server side
import { classifyPost } from './lib/ai-service.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAIClassification() {
  console.log("🚀 Testing AI Classification Service...")
  
  try {
    // Get categories from database
    const categories = await prisma.categories.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    })
    
    const categoryNames = categories.map(cat => cat.name)
    console.log("📋 Available categories:", categoryNames)
    
    // Test content that should get multiple categories
    const testContent = "I'm looking for a software engineering job at a tech startup. I have experience in web development, machine learning, and mobile app design. I'm particularly interested in companies working on innovative AI products for business automation and construction project management."
    
    console.log("\n📝 Testing content:")
    console.log(testContent)
    console.log("\n" + "=".repeat(80))
    
    // Call AI classification
    const result = await classifyPost(testContent, categoryNames)
    
    console.log("\n🎯 AI Classification Result:")
    console.log(JSON.stringify(result, null, 2))
    
    console.log("\n📊 Analysis:")
    console.log(`- Primary category: ${result.category}`)
    console.log(`- All categories: ${result.categories?.join(', ') || 'None'}`)
    console.log(`- Number of categories: ${result.categories?.length || 0}`)
    console.log(`- Confidence: ${result.confidence}`)
    
    if (result.categories && result.categories.length > 1) {
      console.log("\n✅ SUCCESS: Multiple categories detected!")
    } else {
      console.log("\n⚠️ ISSUE: Only single category detected")
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testAIClassification()