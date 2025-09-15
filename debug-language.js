/**
 * Debug script to test what happens during post creation with Sinhala content
 */

// Test the language detection function
function detectLanguage(text) {
  if (!text || text.trim().length === 0) return "English"
  
  // Remove punctuation and spaces for analysis
  const cleanText = text.replace(/[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF]/g, '')
  
  // Sinhala Unicode range: 0D80-0DFF
  if (/[\u0D80-\u0DFF]/.test(cleanText)) {
    return "Sinhala"
  }
  
  // Tamil Unicode range: 0B80-0BFF
  if (/[\u0B80-\u0BFF]/.test(cleanText)) {
    return "Tamil"
  }
  
  // Hindi/Devanagari Unicode range: 0900-097F
  if (/[\u0900-\u097F]/.test(cleanText)) {
    return "Hindi"
  }
  
  // Default to English if no specific script is detected
  return "English"
}

async function debugPostCreation() {
  console.log('🐛 Debugging Post Creation with Non-English Content');
  console.log('=' .repeat(60));

  const testContent = 'මම නව ව්‍යාපාරයක් ආරම්භ කිරීමට සැලසුම් කරමි'; // "I plan to start a new business"
  
  console.log('📝 Test Content:', testContent);
  
  // Test 1: Language Detection
  const detectedLanguage = detectLanguage(testContent);
  console.log('🗣️ Detected Language:', detectedLanguage);
  
  // Test 2: Check Unicode characters
  const unicodePoints = [];
  for (let i = 0; i < testContent.length; i++) {
    const code = testContent.charCodeAt(i);
    if (code > 127) { // Non-ASCII
      unicodePoints.push(`${testContent[i]} (U+${code.toString(16).toUpperCase().padStart(4, '0')})`);
    }
  }
  console.log('🔤 Unicode Characters Found:', unicodePoints.slice(0, 10)); // Show first 10
  
  // Test 3: Check if Sinhala range detection works
  const hasSinhala = /[\u0D80-\u0DFF]/.test(testContent);
  console.log('🇱🇰 Contains Sinhala Characters:', hasSinhala);
  
  // Test 4: Try simulating the API call
  try {
    console.log('\n🔄 Simulating AI Classification API Call...');
    
    const formData = new FormData();
    formData.append('content', testContent);
    formData.append('categoryId', 'some-category-id');
    formData.append('isAnonymous', 'false');
    formData.append('tags', JSON.stringify([]));
    formData.append('originalLanguage', detectedLanguage);
    
    console.log('📤 FormData being sent:');
    for (let [key, value] of formData.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    // Note: We can't actually make the API call from here due to authentication
    console.log('⚠️ Cannot test actual API call from this script (requires authentication)');
    console.log('📋 To test: Create a post in the browser with this content and check server logs');
    
  } catch (error) {
    console.log('❌ Error in simulation:', error.message);
  }
  
  console.log('\n🎯 Expected Behavior:');
  console.log('1. Frontend detects language as "Sinhala"');
  console.log('2. Backend receives originalLanguage="Sinhala"');
  console.log('3. AI service translates to English: "I plan to start a new business"');
  console.log('4. AI categorizes translated text as ["Business"] or ["Business", "Career"]');
  console.log('5. Post shows "Business" category, not "Informative"');
  
  console.log('\n🔍 If still showing "Informative", check:');
  console.log('- Server logs for translation/AI errors');
  console.log('- GOOGLE_GEMINI_API_KEY environment variable');
  console.log('- Network connectivity to Gemini API');
  console.log('- AI service error handling and fallbacks');
}

console.log('Running language detection debug...');
debugPostCreation();