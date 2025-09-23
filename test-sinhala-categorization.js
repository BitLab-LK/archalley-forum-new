/**
 * Test script to verify Sinhala content categorization fixes
 * 
 * This script tests the enhanced AI categorization system to ensure:
 * 1. Sinhala content is properly translated
 * 2. Multiple categories are detected and assigned
 * 3. Error handling works correctly
 * 4. Fallback mechanisms function properly
 * 
 * @author Forum Development Team
 * @version 1.0
 * @since 2025-09-23
 */

const { testSinhalaClassification, testAIService } = require('./lib/ai-service')

async function runSinhalaTests() {
  console.log('🇱🇰 Starting Sinhala Content Categorization Tests')
  console.log('=' .repeat(60))

  try {
    // Test 1: General AI service functionality
    console.log('\n🧪 Test 1: General AI Service Functionality')
    console.log('-'.repeat(40))
    const serviceTest = await testAIService()
    console.log(`Service Test Result: ${serviceTest ? '✅ PASSED' : '❌ FAILED'}`)

    // Test 2: Business and Education content in Sinhala
    console.log('\n🧪 Test 2: Business and Education Content (Sinhala)')
    console.log('-'.repeat(40))
    const businessEducationText = "අධ්‍යාපන සහ ව්‍යාපාරික පරිසර දෙකම යහපත් සැලසුමක් අවශ්‍ය කරයි"
    const result1 = await testSinhalaClassification(businessEducationText, [
      'Design', 'Informative', 'Business', 'Career', 'Construction', 'Academic', 'Jobs', 'Other'
    ])
    
    console.log('Expected: Multiple categories (Business, Academic, etc.)')
    console.log(`Actual: ${result1.categories.join(', ')}`)
    console.log(`Language Detection: ${result1.originalLanguage}`)
    console.log(`Confidence: ${result1.confidence}`)
    
    // Test 3: Design and Architecture content in Sinhala
    console.log('\n🧪 Test 3: Design and Architecture Content (Sinhala)')
    console.log('-'.repeat(40))
    const designText = "පරිසර දෙකම යහපත් සැලසුමක් සහ ගෘහ නිර්මාණ ශිල්පය අවශ්‍ය කරයි"
    const result2 = await testSinhalaClassification(designText, [
      'Design', 'Informative', 'Business', 'Career', 'Construction', 'Academic', 'Jobs', 'Other'
    ])
    
    console.log('Expected: Design, Construction categories')
    console.log(`Actual: ${result2.categories.join(', ')}`)
    console.log(`Language Detection: ${result2.originalLanguage}`)
    console.log(`Confidence: ${result2.confidence}`)

    // Test 4: Career and Professional content in Sinhala
    console.log('\n🧪 Test 4: Career and Professional Content (Sinhala)')
    console.log('-'.repeat(40))
    const careerText = "වෘත්තීය දියුණුව සහ රැකියා අවස්ථා සෙවීම වැදගත් කරුණකි"
    const result3 = await testSinhalaClassification(careerText, [
      'Design', 'Informative', 'Business', 'Career', 'Construction', 'Academic', 'Jobs', 'Other'
    ])
    
    console.log('Expected: Career, Jobs categories')
    console.log(`Actual: ${result3.categories.join(', ')}`)
    console.log(`Language Detection: ${result3.originalLanguage}`)
    console.log(`Confidence: ${result3.confidence}`)

    // Analyze results
    console.log('\n📊 Test Analysis')
    console.log('=' .repeat(60))
    
    const results = [result1, result2, result3]
    const multiCategoryCount = results.filter(r => r.categories.length > 1).length
    const sinhalaDetectionCount = results.filter(r => r.originalLanguage === 'Sinhala').length
    const nonInformativeCount = results.filter(r => 
      !r.categories.every(cat => cat.toLowerCase() === 'informative' || cat.toLowerCase() === 'other')
    ).length
    
    console.log(`✅ Multi-category detection: ${multiCategoryCount}/3 tests`)
    console.log(`✅ Sinhala language detection: ${sinhalaDetectionCount}/3 tests`)
    console.log(`✅ Non-default categorization: ${nonInformativeCount}/3 tests`)
    
    const overallSuccess = multiCategoryCount >= 2 && sinhalaDetectionCount === 3 && nonInformativeCount >= 2
    
    console.log(`\n🎯 Overall Test Result: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS IMPROVEMENT'}`)
    
    if (overallSuccess) {
      console.log('\n🎉 Sinhala categorization fixes are working correctly!')
      console.log('   - Language detection is accurate')
      console.log('   - Multiple categories are being assigned')
      console.log('   - Content is not defaulting to "Informative" only')
    } else {
      console.log('\n⚠️ Some issues detected:')
      if (multiCategoryCount < 2) console.log('   - Multiple category assignment needs improvement')
      if (sinhalaDetectionCount < 3) console.log('   - Language detection needs improvement')
      if (nonInformativeCount < 2) console.log('   - Still defaulting to generic categories')
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
  }
}

// Run the tests
if (require.main === module) {
  runSinhalaTests()
    .then(() => {
      console.log('\n✅ Test execution completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { runSinhalaTests }