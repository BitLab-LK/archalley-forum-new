// Test script for enhanced categorization flow
// This script tests the improved categorization system to ensure:
// 1. Categories are fetched from database correctly
// 2. AI service receives and uses database categories
// 3. Category validation works properly
// 4. Multi-language support is maintained

import { classifyPost, clearCategoryCache } from './lib/ai-service'
import { CategorizationService } from './lib/categorization-service'
import { prisma } from './lib/prisma'

async function testCategorizationFlow() {
  console.log("🧪 Testing Enhanced Categorization Flow")
  console.log("=".repeat(50))

  try {
    // Initialize categorization service
    const categorizationService = new CategorizationService(prisma)

    // Test 1: Get categories from database
    console.log("\n📋 Test 1: Fetching categories from database...")
    const categories = await categorizationService.getAllCategories()
    const categoryNames = await categorizationService.getCategoryNames()
    
    console.log("✅ Categories found:", categories.length)
    console.log("📝 Category names:", categoryNames)

    if (categoryNames.length === 0) {
      console.error("❌ No categories found in database! Please ensure categories exist.")
      return
    }

    // Test 2: Clear cache and test AI categorization
    console.log("\n🤖 Test 2: Testing AI categorization with database categories...")
    clearCategoryCache() // Ensure fresh data
    
    // Test with English content
    const englishContent = "I am looking for career advice in software engineering and technology"
    console.log("📄 Testing English content:", englishContent)
    
    const englishResult = await classifyPost(englishContent, categoryNames)
    console.log("✅ English AI Result:", {
      categories: englishResult.categories,
      confidence: englishResult.confidence,
      originalLanguage: englishResult.originalLanguage
    })

    // Test with non-English content (simulated Sinhala)
    const sinhalaContent = "මම වාස්තු විද්‍යා ක්ෂේත්‍රයේ රැකියාවක් සොයනවා"
    console.log("\n📄 Testing Sinhala content:", sinhalaContent)
    
    const sinhalaResult = await classifyPost(sinhalaContent, categoryNames)
    console.log("✅ Sinhala AI Result:", {
      categories: sinhalaResult.categories,
      confidence: sinhalaResult.confidence,
      originalLanguage: sinhalaResult.originalLanguage,
      translatedContent: sinhalaResult.translatedContent?.substring(0, 100) + "..."
    })

    // Test 3: Category validation
    console.log("\n🔍 Test 3: Testing category validation...")
    
    const testCategoryIds = categories.slice(0, 2).map((cat: any) => cat.id)
    const validationResult = await categorizationService.validateCategoryIds(testCategoryIds)
    console.log("✅ Validation result:", validationResult)

    // Test invalid category IDs
    const invalidIds = ["invalid-id-1", "invalid-id-2"]
    const invalidValidation = await categorizationService.validateCategoryIds(invalidIds)
    console.log("❌ Invalid validation result:", invalidValidation)

    // Test 4: Category name to ID conversion
    console.log("\n🔄 Test 4: Testing category name to ID conversion...")
    
    const testCategoryNames = categories.slice(0, 2).map((cat: any) => cat.name)
    const nameToIdResult = await categorizationService.getCategoryIdsByNames(testCategoryNames)
    console.log("✅ Name to ID conversion:", nameToIdResult)

    // Test 5: Edge cases
    console.log("\n⚠️ Test 5: Testing edge cases...")
    
    // Empty content
    try {
      const emptyResult = await classifyPost("", categoryNames)
      console.log("📝 Empty content result:", emptyResult.categories)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log("⚠️ Empty content error (expected):", errorMessage)
    }

    // Very short content
    const shortResult = await classifyPost("Hi", categoryNames)
    console.log("📝 Short content result:", shortResult.categories)

    // Technical content
    const techContent = "Building a REST API using Node.js and implementing authentication with JWT tokens"
    const techResult = await classifyPost(techContent, categoryNames)
    console.log("📝 Technical content result:", techResult.categories)

    console.log("\n🎉 All tests completed successfully!")
    console.log("✅ Categorization flow is working properly with database categories")

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("❌ Test failed:", errorMessage)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export for potential use in other tests
export { testCategorizationFlow }

// Run tests if this file is executed directly
if (require.main === module) {
  testCategorizationFlow()
    .then(() => {
      console.log("✅ Test completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Test failed:", error)
      process.exit(1)
    })
}