/**
 * Simple Node.js test for AI Service Multiple Categories
 * 
 * This test directly calls the AI service function to verify
 * multiple categories are working without needing authentication.
 */

// Load environment variables from .env file
require('dotenv').config();

// Mock the required modules and setup
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Available categories matching your system
const availableCategories = [
  "Design",
  "Informative", 
  "Business",
  "Career",
  "Construction",
  "Academic",
  "Jobs",
  "Other"
];

// Test content examples
const testContent = [
  {
    title: "Business + Career Content",
    text: "Starting a freelance consulting business. Looking for career advice on how to build a professional network and find clients for my business management services.",
    expected: ["Business", "Career"]
  },
  {
    title: "Construction + Business Content", 
    text: "My construction company is expanding and I need help with project management and budgeting. Any business tips for managing multiple building projects?",
    expected: ["Construction", "Business"]
  },
  {
    title: "Design + Career Content",
    text: "Interior design portfolio review. I'm a freelance designer looking to advance my career and improve my visual design skills.",
    expected: ["Design", "Career"]
  },
  {
    title: "Pure Design Content",
    text: "Looking for color palette inspiration for modern UI design. Need help with aesthetic choices and visual layout principles.",
    expected: ["Design"]
  },
  {
    title: "Random Content",
    text: "abc123 random text xyz hello",
    expected: ["Other"]
  }
];

// Simplified AI classification function for testing
async function testClassifyPost(content, categories) {
  // Check if API key is available
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  if (!API_KEY) {
    console.log("⚠️ GOOGLE_GEMINI_API_KEY not found in environment variables");
    return {
      category: "Other",
      categories: ["Other"],
      tags: [],
      confidence: 0,
      note: "No API key available"
    };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    }
  });

  const prompt = `You are an expert content categorizer. Analyze the following content and classify it into appropriate categories.

AVAILABLE CATEGORIES (choose 1-3 most relevant):
${categories.map((cat, index) => `${index + 1}. ${cat}`).join('\n')}

CONTENT TO ANALYZE:
"${content}"

CLASSIFICATION RULES:
1. Select 1-3 most relevant categories from the list above
2. Categories must match EXACTLY as written in the list (case-sensitive)
3. If content is meaningful and relevant, select appropriate categories
4. If content is unclear, random, or doesn't fit any category, use "Other"
5. You can select multiple categories if content spans multiple domains

EXAMPLES:
- "Looking for interior design tips" → ["Design"]
- "Starting a freelance business as an architect" → ["Business", "Career", "Design"]
- "University degree in construction management" → ["Academic", "Construction"]
- "Job opening for software developer" → ["Jobs", "Career"]
- "Random text abc123" → ["Other"]

Return your response as JSON in this exact format:
{
  "categories": ["Category1", "Category2"],
  "tags": ["keyword1", "keyword2", "keyword3"],
  "confidence": 0.85
}

Requirements:
- "categories" array must contain 1-3 exact category names from the list above
- "tags" should be 3-5 relevant keywords from the content
- "confidence" should be between 0.1 and 1.0
- Use "Other" if content doesn't clearly fit available categories`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from response
    let jsonData;
    try {
      jsonData = JSON.parse(responseText.trim());
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText];
      const jsonStr = jsonMatch[1].trim();
      jsonData = JSON.parse(jsonStr);
    }

    return {
      category: jsonData.categories?.[0] || "Other",
      categories: jsonData.categories || ["Other"], 
      tags: jsonData.tags || [],
      confidence: jsonData.confidence || 0.5,
      rawResponse: responseText
    };
  } catch (error) {
    console.error(`❌ Error classifying content: ${error.message}`);
    return {
      category: "Other",
      categories: ["Other"],
      tags: [],
      confidence: 0,
      error: error.message
    };
  }
}

// Run the tests
async function runTests() {
  console.log("🧪 Testing AI Service Multiple Categories");
  console.log("=" .repeat(60));
  console.log(`Available Categories: ${availableCategories.join(", ")}`);
  console.log("=" .repeat(60));

  for (const test of testContent) {
    console.log(`\n📝 Test: ${test.title}`);
    console.log(`Content: "${test.text}"`);
    console.log(`Expected: [${test.expected.join(", ")}]`);
    
    const result = await testClassifyPost(test.text, availableCategories);
    
    console.log(`✅ AI Result: [${result.categories.join(", ")}]`);
    console.log(`Confidence: ${result.confidence}`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      // Check if at least one expected category is found
      const hasMatch = test.expected.some(expected => 
        result.categories.some(actual => 
          actual.toLowerCase() === expected.toLowerCase()
        )
      );
      
      if (hasMatch) {
        console.log("✅ PASS: Contains expected categories");
      } else {
        console.log("❌ FAIL: No expected categories found");
      }
    }
    
    console.log("-" .repeat(40));
  }
  
  console.log("\n🎯 Test Complete!");
  console.log("Expected behavior:");
  console.log("- Business + Career content should return both categories");
  console.log("- Single domain content should return one category");
  console.log("- Random content should return 'Other'");
}

// Check if running directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testClassifyPost, runTests, testContent, availableCategories };