// Test the AI classification service directly
const content = "I'm looking for a software engineering job at a tech startup. I have experience in web development, machine learning, and mobile app design. I'm particularly interested in companies that are working on innovative AI products for business automation."

console.log("Testing AI classification for content:")
console.log(content)
console.log("\n" + "=".repeat(80) + "\n")

fetch("http://localhost:3000/api/ai/classify", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ content: content.trim() }),
})
.then(response => response.json())
.then(data => {
  console.log("AI Classification Response:")
  console.log(JSON.stringify(data, null, 2))
  
  if (data.categories && Array.isArray(data.categories)) {
    console.log("\n✅ Multiple categories found:", data.categories)
  } else if (data.category) {
    console.log("\n⚠️ Single category only:", data.category)
  } else {
    console.log("\n❌ No valid classification found")
  }
})
.catch(error => {
  console.error("❌ Error:", error)
})