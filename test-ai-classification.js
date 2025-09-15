// Test AI classification API
const testContent = "I'm working on a UI/UX design project for a construction company's website. Need help with creating modern architectural layouts and visual design elements for building contractors."

async function testAIClassification() {
  try {
    console.log("🧪 Testing AI Classification API...")
    console.log("📝 Content:", testContent)
    
    const response = await fetch('http://localhost:3000/api/ai/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: testContent })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log("✅ AI Classification Result:", result)
      console.log("📊 Categories:", result.categories)
      console.log("🎯 Primary:", result.category)
      console.log("🔍 Confidence:", result.confidence)
    } else {
      console.log("❌ Error:", response.status, response.statusText)
      const errorText = await response.text()
      console.log("Error details:", errorText)
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message)
  }
}

// Run if server is available
if (typeof window !== 'undefined') {
  testAIClassification()
} else {
  console.log("Copy this code and run it in your browser console when logged into the app")
}