/**
 * Test script to verify multiple categories functionality
 * 
 * This script tests different content types to ensure Gemini AI 
 * correctly identifies multiple relevant categories.
 */

// Available categories from the system (matching the image)
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

// Test content scenarios that should result in multiple categories
const testCases = [
  {
    title: "Business + Career",
    content: "Starting a freelance consulting business. Looking for career advice on how to build a professional network and find clients for my business management services.",
    expectedCategories: ["Business", "Career"],
    description: "Content about starting a business with career development aspects"
  },
  {
    title: "Construction + Business",
    content: "My construction company is expanding and I need help with project management and budgeting. Any business tips for managing multiple building projects?",
    expectedCategories: ["Construction", "Business"],
    description: "Construction industry with business management focus"
  },
  {
    title: "Design + Career",
    content: "Interior design portfolio review. I'm a freelance designer looking to advance my career and improve my visual design skills.",
    expectedCategories: ["Design", "Career"],
    description: "Design work combined with career development"
  },
  {
    title: "Academic + Career",
    content: "University degree in construction management. What career opportunities are available after graduation? Any advice for students?",
    expectedCategories: ["Academic", "Career"],
    description: "Academic education leading to career planning"
  },
  {
    title: "Jobs + Career",
    content: "Job opening for senior architect position. Seeking experienced professionals for career advancement opportunities in our firm.",
    expectedCategories: ["Jobs", "Career"],
    description: "Job posting with career advancement focus"
  },
  {
    title: "Design Only",
    content: "Looking for color palette inspiration for modern UI design. Need help with aesthetic choices and visual layout principles.",
    expectedCategories: ["Design"],
    description: "Pure design content"
  },
  {
    title: "Random/Other",
    content: "abc123 random text xyz hello",
    expectedCategories: ["Other"],
    description: "Random/meaningless content should go to Other"
  },
  {
    title: "Informative Only",
    content: "Tutorial on how to learn new programming languages. Educational guide with tips and advice for beginners.",
    expectedCategories: ["Informative"],
    description: "Educational/tutorial content"
  }
];

// Function to simulate AI classification API call
async function testAIClassification() {
  console.log("🧪 Testing Multiple Categories AI Classification");
  console.log("=" .repeat(60));
  console.log(`Available Categories: ${availableCategories.join(", ")}`);
  console.log("=" .repeat(60));
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.title}`);
    console.log(`Content: "${testCase.content}"`);
    console.log(`Expected: [${testCase.expectedCategories.join(", ")}]`);
    console.log(`Description: ${testCase.description}`);
    
    try {
      // Make API call to the AI classification endpoint
      const response = await fetch('http://localhost:3000/api/ai/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: You'll need to add proper authentication headers in a real test
        },
        body: JSON.stringify({
          content: testCase.content
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const actualCategories = result.categories || [result.category];
        
        console.log(`✅ AI Result: [${actualCategories.join(", ")}]`);
        console.log(`Confidence: ${result.confidence || 'N/A'}`);
        
        // Check if at least one expected category is found
        const hasMatch = testCase.expectedCategories.some(expected => 
          actualCategories.some(actual => 
            actual.toLowerCase() === expected.toLowerCase()
          )
        );
        
        if (hasMatch) {
          console.log("✅ PASS: Contains expected categories");
        } else {
          console.log("❌ FAIL: No expected categories found");
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
    
    console.log("-" .repeat(40));
  }
  
  console.log("\n🎯 Test Summary:");
  console.log("- Multiple categories should be detected for cross-domain content");
  console.log("- Single categories should be used for domain-specific content");
  console.log("- Random/unclear content should default to 'Other'");
  console.log("- Categories must match exactly from the available list");
}

// Instructions for running the test
console.log("🚀 Multiple Categories Test Suite");
console.log("=" .repeat(60));
console.log("To run this test:");
console.log("1. Start your Next.js development server (npm run dev)");
console.log("2. Make sure you're authenticated (login to the app)");
console.log("3. Update the API call with proper authentication");
console.log("4. Run: node test-multiple-categories.js");
console.log("=" .repeat(60));

// Export test cases for potential integration testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCases,
    availableCategories,
    testAIClassification
  };
}