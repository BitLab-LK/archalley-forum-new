const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testAIService() {
  console.log("🧪 Testing AI Service...");
  
  // Check if API key is available
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  if (!API_KEY) {
    console.log("❌ GOOGLE_GEMINI_API_KEY is not set");
    return false;
  }
  
  console.log("✅ API key found");
  
  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });
    
    console.log("✅ Gemini model initialized");
    
    // Test with a simple prompt
    const testPrompt = `Analyze the following text and determine the most appropriate category. The category must be one of: Business, Design, Career, Construction, Academic, Informative, Other.

Text: "I'm looking for advice on starting my own architecture firm. What are the key considerations for business planning and client acquisition?"

Return the response in this exact JSON format:
{
  "category": "one of the available categories",
  "tags": ["array", "of", "relevant", "tags"],
  "confidence": 0.95
}`;

    console.log("🤖 Calling Gemini API...");
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log("📝 Raw response:", responseText);
    
    // Try to parse the response
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText];
      const jsonStr = jsonMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      
      console.log("✅ Successfully parsed response:", parsed);
      
      if (parsed.category && Array.isArray(parsed.tags)) {
        console.log("🎉 AI service is working correctly!");
        return true;
      } else {
        console.log("❌ Response format is invalid");
        return false;
      }
    } catch (parseError) {
      console.log("❌ Failed to parse JSON response:", parseError.message);
      return false;
    }
    
  } catch (error) {
    console.error("❌ AI service test failed:", error.message);
    return false;
  }
}

// Run the test
testAIService().then(success => {
  if (success) {
    console.log("✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Tests failed!");
    process.exit(1);
  }
}).catch(error => {
  console.error("❌ Test error:", error);
  process.exit(1);
}); 