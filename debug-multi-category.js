// Quick test script to debug categorization
// Run this in your browser console on your site

async function debugCategorizationIssue() {
  console.log("🔍 DEBUGGING CATEGORIZATION ISSUE");
  
  const testContent = "I'm starting a construction company and need advice on project management software and budgeting for residential projects.";
  
  console.log("📝 Testing content:", testContent);
  console.log("🎯 Expected categories: Construction, Business");
  
  try {
    const response = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: testContent })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ API Error:", error);
      return;
    }

    const result = await response.json();
    
    console.log("\n📊 RESULTS:");
    console.log("Primary Category:", result.category);
    console.log("All Categories:", result.categories);
    console.log("Is Array?", Array.isArray(result.categories));
    console.log("Length:", result.categories?.length || 0);
    console.log("Tags:", result.tags);
    console.log("Confidence:", result.confidence);
    
    console.log("\n🔬 ANALYSIS:");
    if (result.categories && result.categories.length > 1) {
      console.log("✅ SUCCESS: Multiple categories detected!");
      if (result.categories.includes("Construction") && result.categories.includes("Business")) {
        console.log("✅ PERFECT: Got expected categories!");
      } else {
        console.log("⚠️ PARTIAL: Got multiple categories but not the expected ones");
      }
    } else {
      console.log("❌ PROBLEM: Only single category returned");
      console.log("This suggests the AI prompt is not working correctly");
    }
    
    console.log("\n📄 Full Response:");
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Also test a different content type
async function testMultipleContents() {
  console.log("\n🧪 TESTING MULTIPLE CONTENT TYPES");
  
  const tests = [
    {
      content: "I'm starting a construction company and need business advice",
      expected: ["Construction", "Business"]
    },
    {
      content: "Looking for career advice as a civil engineering student",
      expected: ["Career", "Academic"]
    },
    {
      content: "Interior design tips for small apartments",
      expected: ["Design"]
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📝 Testing: "${test.content}"`);
    console.log(`🎯 Expected: ${test.expected.join(", ")}`);
    
    try {
      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: test.content })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📊 Got: ${(result.categories || [result.category]).join(", ")}`);
        
        const hasExpected = test.expected.some(exp => 
          (result.categories || [result.category]).includes(exp)
        );
        console.log(hasExpected ? "✅ PASS" : "❌ FAIL");
      } else {
        console.log("❌ API Error");
      }
    } catch (error) {
      console.log("❌ Error:", error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run both tests
debugCategorizationIssue().then(() => {
  console.log("\n" + "=".repeat(50));
  return testMultipleContents();
});