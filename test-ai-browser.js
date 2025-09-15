/**
 * Test environment and AI service availability
 */

async function testAIServiceEnvironment() {
  console.log('🔧 Testing AI Service Environment');
  console.log('=' .repeat(40));

  try {
    // Test if we can access the AI classification endpoint
    const response = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'මම නව ව්‍යාපාරයක් ආරම්භ කිරීමට සැලසුම් කරමි', // "I plan to start a new business" in Sinhala
        originalLanguage: 'Sinhala'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ AI Classification API Response:');
      console.log('   🗣️  Original Language:', result.originalLanguage);
      console.log('   🔄 Translated Content:', result.translatedContent);
      console.log('   📂 Categories:', result.categories);
      console.log('   🎯 Confidence:', result.confidence);
      console.log('   🏷️  Tags:', result.tags);
      
      if (result.categories && result.categories.includes('Informative') && result.translatedContent === result.originalContent) {
        console.log('   ⚠️  ISSUE: Content not translated and defaulted to Informative');
      }
    } else {
      console.log('❌ AI Classification API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('   Error details:', errorText);
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Test another language
async function testTamilClassification() {
  console.log('\n🔧 Testing Tamil Classification');
  console.log('=' .repeat(40));

  try {
    const response = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'நான் ஒரு புதிய வீட்டின் வடிவமைப்பு தேவை', // "I need a new house design" in Tamil
        originalLanguage: 'Tamil'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Tamil Classification Result:');
      console.log('   🗣️  Original Language:', result.originalLanguage);
      console.log('   🔄 Translated Content:', result.translatedContent);
      console.log('   📂 Categories:', result.categories);
      
      if (result.categories && result.categories.includes('Design')) {
        console.log('   ✅ SUCCESS: Properly categorized as Design');
      } else if (result.categories && result.categories.includes('Informative')) {
        console.log('   ⚠️  ISSUE: Defaulted to Informative instead of Design');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

console.log('🌍 Multi-Language AI Classification Test');
console.log('This will test if the AI service can properly translate and categorize non-English content.');

testAIServiceEnvironment().then(() => testTamilClassification()).catch(console.error);