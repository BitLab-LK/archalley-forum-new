import { GoogleGenerativeAI } from "@google/generative-ai"

// Check if API key is available at startup
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY
if (!API_KEY) {
  console.warn("⚠️ GOOGLE_GEMINI_API_KEY is not set. AI features will be disabled.")
}

// Initialize the Google Generative AI client
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null
const model = genAI ? genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
}) : null

// Available categories for classification
const AVAILABLE_CATEGORIES = [
  "Business",
  "Design",
  "Career",
  "Construction",
  "Academic",
  "Informative",
  "Other"
]

interface TranslationResult {
  translatedText: string
  detectedLanguage: string
}

interface AIClassification {
  category: string
  tags: string[]
  confidence: number
  originalLanguage: string
  translatedContent: string
}

// Helper function to extract JSON from markdown-formatted text
function extractJsonFromMarkdown(text: string): any {
  try {
    // First, try to parse as direct JSON
    return JSON.parse(text.trim())
  } catch {
    // If that fails, try to extract from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
    const jsonStr = jsonMatch[1].trim()
    
    try {
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error("Failed to parse JSON from AI response:", jsonStr)
      console.error("Original text:", text)
      throw new Error("Invalid JSON response from AI")
    }
  }
}

async function detectAndTranslate(text: string): Promise<TranslationResult> {
  // Check if API key and model are available
  if (!API_KEY || !model) {
    console.warn("Google Gemini API key not configured, skipping translation")
    return {
      translatedText: text,
      detectedLanguage: "English"
    }
  }

  const prompt = `Detect the language of the following text and translate it to English if it's not already in English. Return the result as a JSON object with 'translatedText' and 'detectedLanguage' fields. If the text is already in English, return the original text.

Text: "${text}"

Return the response in this exact JSON format:
{
  "translatedText": "the translated or original text",
  "detectedLanguage": "the detected language name in English"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()
    
    const data = extractJsonFromMarkdown(responseText)

    if (!data.translatedText || !data.detectedLanguage) {
      console.warn("Translation response missing required fields:", data)
      return {
        translatedText: text,
        detectedLanguage: "English"
      }
    }

    console.log("✅ Translation successful:", {
      original: text.substring(0, 100) + "...",
      translated: data.translatedText.substring(0, 100) + "...",
      detectedLanguage: data.detectedLanguage
    })

    return {
      translatedText: data.translatedText,
      detectedLanguage: data.detectedLanguage
    }
  } catch (error) {
    console.error("❌ Translation error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    })
    // Fallback to original text if translation fails
    return {
      translatedText: text,
      detectedLanguage: "English"
    }
  }
}

export async function classifyPost(content: string): Promise<AIClassification> {
  try {
    // Check if API key and model are available
    if (!API_KEY || !model) {
      console.warn("Google Gemini API key not configured, using default classification")
      return {
        category: "Other",
        tags: [],
        confidence: 0,
        originalLanguage: "English",
        translatedContent: content
      }
    }

    console.log("🚀 Starting AI classification for content:", content.substring(0, 100) + "...")

    // Step 1: Detect language and translate if needed
    const { translatedText, detectedLanguage } = await detectAndTranslate(content)
    const originalLanguage = detectedLanguage

    // Step 2: Analyze content for category and tags
    const prompt = `Analyze the following text and determine the most appropriate category and generate relevant tags. The category must be exactly one of: ${AVAILABLE_CATEGORIES.join(", ")}.

Category descriptions:
- Business: Business strategies, entrepreneurship, marketing, finance, management, industry trends, company news, startups, economics
- Design: Architectural designs, interior design, graphic design, UI/UX design, visual arts, creative inspiration, aesthetics
- Career: Career advice, job opportunities, professional development, workplace issues, resume tips, interviews, hiring
- Construction: Construction techniques, building materials, project management, engineering, infrastructure development, renovation
- Academic: Educational content, research papers, theories, university/college topics, scholarly discussions, learning resources
- Informative: General news, updates, how-to guides, tutorials, factual information, knowledge sharing, instructional content
- Other: Any content that clearly doesn't fit into the above categories, miscellaneous topics, general discussions

Text: "${translatedText}"

Special instructions:
1. The category MUST be one of the exact names from the list: ${AVAILABLE_CATEGORIES.join(", ")}
2. Don't invent new categories or combine categories
3. For general or mixed content, prefer "Other" category
4. For news, guides, or information-sharing content, prefer "Informative" category
5. For educational, research, or scholarly content, prefer "Academic" category
6. Match case exactly as provided in the category list

Return the response in this exact JSON format:
{
  "category": "one of the available categories",
  "tags": ["array", "of", "relevant", "tags"],
  "confidence": 0.95
}`

    console.log("🤖 Calling Gemini API for classification...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()

    console.log("📝 Raw classification response:", responseText)

    // Parse the JSON response
    const classification = extractJsonFromMarkdown(responseText) as AIClassification

    // Validate classification response
    if (!classification.category || !Array.isArray(classification.tags)) {
      console.warn("Invalid classification response:", classification)
      return {
        category: "Other",
        tags: [],
        confidence: 0.5,
        originalLanguage,
        translatedContent: translatedText
      }
    }

    // Validate category
    const normalizedCategory = classification.category.trim()
    
    // Check if the category exists in our available categories (case-insensitive)
    const matchedCategory = AVAILABLE_CATEGORIES.find(
      cat => cat.toLowerCase() === normalizedCategory.toLowerCase()
    )
    
    if (matchedCategory) {
      // Use the correct casing from our defined categories
      classification.category = matchedCategory
      console.log(`Category matched: "${classification.category}" with confidence ${classification.confidence}`)
    } else {
      console.warn(`Invalid category "${normalizedCategory}", available categories:`, AVAILABLE_CATEGORIES)
      
      // Try to find the closest matching category
      let bestMatch = "Other";
      
      // First check if any category is a substring of the normalized category
      for (const category of AVAILABLE_CATEGORIES) {
        if (normalizedCategory.toLowerCase().includes(category.toLowerCase())) {
          bestMatch = category;
          break;
        }
      }
      
      // If still no match, check if normalized category is a substring of any category
      if (bestMatch === "Other") {
        for (const category of AVAILABLE_CATEGORIES) {
          if (category.toLowerCase().includes(normalizedCategory.toLowerCase())) {
            bestMatch = category;
            break;
          }
        }
      }
      
      classification.category = bestMatch;
      classification.confidence = 0.5;
      
      console.log(`Remapped invalid category "${normalizedCategory}" to "${bestMatch}"`);
    }

    // Add translation info
    classification.originalLanguage = originalLanguage
    classification.translatedContent = translatedText

    console.log("✅ Classification successful:", {
      category: classification.category,
      tags: classification.tags,
      confidence: classification.confidence,
      originalLanguage
    })

    return classification
  } catch (error) {
    console.error("❌ AI classification error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    })
    // Return a default classification in case of error
    return {
      category: "Other",
      tags: [],
      confidence: 0,
      originalLanguage: "English",
      translatedContent: content
    }
  }
}

// Test function to verify AI service is working
export async function testAIService(): Promise<boolean> {
  try {
    if (!API_KEY || !model) {
      console.log("❌ AI service not available - no API key")
      return false
    }

    console.log("🧪 Testing AI service...")
    const testResult = await classifyPost("This is a test post about architecture and design.")
    
    if (testResult.category && testResult.tags.length > 0) {
      console.log("✅ AI service test successful:", testResult)
      return true
    } else {
      console.log("❌ AI service test failed - invalid response")
      return false
    }
  } catch (error) {
    console.error("❌ AI service test failed:", error)
    return false
  }
} 