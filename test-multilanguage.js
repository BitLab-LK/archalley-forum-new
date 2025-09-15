/**
 * Test translation and categorization for non-English content
 */

const { classifyPost } = require('./lib/ai-service.ts');

async function testMultiLanguageClassification() {
  console.log('🌍 Testing Multi-Language Post Classification');
  console.log('=' .repeat(60));

  const testCases = [
    {
      language: 'Sinhala',
      content: 'මම නව ව්‍යාපාරයක් ආරම්භ කිරීමට සැලසුම් කරමි. මට ව්‍යාපාරික සහාය අවශ්‍යයි.',
      expectedCategories: ['Business'],
      description: 'Starting a business in Sinhala'
    },
    {
      language: 'Sinhala', 
      content: 'මගේ නිවසේ සැලසුම සඳහා ගෘහ නිර්මාණ උපදෙස් අවශ්‍යයි.',
      expectedCategories: ['Design'],
      description: 'Home design advice in Sinhala'
    },
    {
      language: 'Tamil',
      content: 'நான் ஒரு புதிய வேலை தேடுகிறேன். மென்பொருள் டெவலப்பர் பதவிகள் உண்டா?',
      expectedCategories: ['Jobs', 'Career'],
      description: 'Job search in Tamil'
    },
    {
      language: 'Hindi',
      content: 'मुझे कंस्ट्रक्शन इंजीनियरिंग में डिग्री करनी है। कौन सी यूनिवर्सिटी अच्छी है?',
      expectedCategories: ['Academic', 'Construction'],
      description: 'University advice for construction engineering in Hindi'
    },
    {
      language: 'English (control)',
      content: 'I need help starting a freelance design business from home.',
      expectedCategories: ['Business', 'Career', 'Design'],
      description: 'English control test'
    }
  ];

  const categories = [
    "Design",
    "Informative", 
    "Business",
    "Career",
    "Construction",
    "Academic",
    "Jobs",
    "Other"
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.description}`);
    console.log(`📝 Original Content: ${testCase.content}`);
    console.log(`🎯 Expected Categories: ${testCase.expectedCategories.join(', ')}`);
    
    try {
      const result = await classifyPost(testCase.content, categories);
      
      console.log(`\n✅ AI Results:`);
      console.log(`   🗣️  Detected Language: ${result.originalLanguage}`);
      console.log(`   🔄 Translated Content: ${result.translatedContent}`);
      console.log(`   📂 Suggested Categories: ${result.categories?.join(', ') || result.category}`);
      console.log(`   🎯 Confidence: ${result.confidence}`);
      console.log(`   🏷️  Tags: ${result.tags.join(', ')}`);
      
      // Check if translation worked
      if (result.originalLanguage === 'English' && testCase.language !== 'English (control)') {
        console.log(`   ⚠️  WARNING: Expected non-English but detected English`);
      }
      
      // Check if categorization makes sense
      const suggestedCategories = result.categories || [result.category];
      const hasExpectedCategory = testCase.expectedCategories.some(expected => 
        suggestedCategories.includes(expected)
      );
      
      if (hasExpectedCategory) {
        console.log(`   ✅ SUCCESS: Contains expected category`);
      } else if (suggestedCategories.includes('Informative') && !testCase.expectedCategories.includes('Informative')) {
        console.log(`   ❌ ISSUE: Defaulted to 'Informative' - may indicate translation/categorization failure`);
      } else {
        console.log(`   ⚠️  Different categorization than expected (may still be valid)`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log(`   ${'─'.repeat(50)}`);
  }
  
  console.log('\n🎯 Summary:');
  console.log('If you see many "Informative" categories for non-English content,');
  console.log('it suggests the translation or API key might not be working properly.');
}

// Test if we're in the right environment
if (typeof module !== 'undefined' && module.exports) {
  console.log('🔧 Node.js environment detected');
  testMultiLanguageClassification().catch(console.error);
} else {
  console.log('🌐 Browser environment - export the test function');
  // For browser testing
  window.testMultiLanguageClassification = testMultiLanguageClassification;
}