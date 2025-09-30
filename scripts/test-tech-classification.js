// Quick test script for the AI categorization with Technology category
const { classifyPost } = require('../lib/ai-service')

async function testTechnologyClassification() {
  console.log('🧪 Testing Technology categorization...\n')
  
  const techContent = "🌐 Technology Update\nExploring innovations and solutions in modern technology — from software engineering and cloud computing to AI, cybersecurity, and data-driven applications. Focused on practical implementations, performance improvements, and emerging tools that shape the digital world."
  
  const testCategories = [
    "Design",
    "Informative",
    "Business", 
    "Career",
    "Construction",
    "Academic",
    "Jobs",
    "Technology",
    "Other"
  ]
  
  try {
    console.log("📝 Content to classify:", techContent.substring(0, 100) + "...")
    console.log("📋 Available categories:", testCategories)
    console.log("")
    
    const result = await classifyPost(techContent, testCategories)
    
    console.log("🎯 Classification Result:")
    console.log("  Primary Category:", result.category)
    console.log("  All Categories:", result.categories)
    console.log("  Confidence:", result.confidence)
    console.log("  Original Language:", result.originalLanguage)
    console.log("  Tags:", result.tags)
    console.log("")
    
    // Check if Technology was correctly identified
    const hasTechnology = result.categories?.includes('Technology') || result.category === 'Technology'
    console.log(hasTechnology ? "✅ SUCCESS: Technology category correctly identified!" : "❌ FAILED: Technology category not identified")
    
    if (!hasTechnology) {
      console.log("🔍 Expected: Technology")
      console.log("🔍 Got:", result.categories || [result.category])
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    // Test fallback behavior
    console.log('\n🔄 Testing fallback behavior...')
    const fallbackResult = {
      category: "Technology",
      categories: ["Technology"],
      tags: ["technology", "software", "innovation"],
      confidence: 0,
      originalLanguage: "English",
      translatedContent: techContent
    }
    console.log("📋 Fallback would return:", fallbackResult)
  }
}

// Run the test
testTechnologyClassification()

module.exports = { testTechnologyClassification }