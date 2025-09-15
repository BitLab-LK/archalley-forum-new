// Simple test to call AI classification API with authentication
const puppeteer = require('puppeteer')

async function testAIClassification() {
  console.log("🚀 Starting AI classification test...")
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  })
  
  const page = await browser.newPage()
  
  try {
    // Navigate to the application
    console.log("📱 Navigating to application...")
    await page.goto('http://localhost:3000')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Get cookies for authentication
    const cookies = await page.cookies()
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'))
    
    console.log("🍪 Found cookies:", cookies.map(c => c.name))
    
    // Make authenticated request to AI classification API
    const response = await page.evaluate(async () => {
      try {
        const testContent = "I'm looking for a software engineering job at a startup. I have experience in web development, machine learning, and mobile app design. I'm particularly interested in companies working on innovative AI products for business automation and construction project management."
        
        console.log("🤖 Testing AI classification with content:", testContent.substring(0, 50) + "...")
        
        const response = await fetch("/api/ai/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: testContent }),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("❌ Classification failed:", response.status, errorText)
          return { error: `HTTP ${response.status}: ${errorText}` }
        }
        
        const result = await response.json()
        console.log("✅ Classification result:", result)
        return result
        
      } catch (error) {
        console.error("❌ Error in classification:", error)
        return { error: error.message }
      }
    })
    
    console.log("\n🎯 AI Classification Test Result:")
    console.log(JSON.stringify(response, null, 2))
    
    if (response.categories && Array.isArray(response.categories)) {
      console.log(`\n✅ Success! Found ${response.categories.length} categories: ${response.categories.join(', ')}`)
    } else if (response.category) {
      console.log(`\n⚠️ Single category only: ${response.category}`)
    } else if (response.error) {
      console.log(`\n❌ Error: ${response.error}`)
    } else {
      console.log(`\n❓ Unexpected response format`)
    }
    
  } catch (error) {
    console.error("💥 Test failed:", error)
  } finally {
    await browser.close()
  }
}

testAIClassification()