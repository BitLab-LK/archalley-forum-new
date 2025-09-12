// Debug script to test AI categorization
// Run this in your browser console after navigating to your site

async function testAICategorization() {
  const testContent = "I'm starting a construction company and need advice on project management software and budgeting for residential projects.";
  
  console.log("🧪 Testing AI Categorization...");
  console.log("📝 Content:", testContent);
  
  try {
    const response = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: testContent })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error:", errorData);
      return;
    }

    const result = await response.json();
    
    console.log("✅ Classification Result:");
    console.log("📊 Primary Category:", result.category);
    console.log("📊 All Categories:", result.categories);
    console.log("🏷️ Tags:", result.tags);
    console.log("🎯 Confidence:", result.confidence);
    console.log("🌐 Language:", result.originalLanguage);
    console.log("📄 Full Response:", result);
    
    // Check if multiple categories are returned
    if (result.categories && result.categories.length > 1) {
      console.log("✅ SUCCESS: Multiple categories detected!");
    } else {
      console.log("⚠️ ISSUE: Only single category returned");
      console.log("Expected: Construction, Business");
      console.log("Got:", result.categories || [result.category]);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the test
testAICategorization();