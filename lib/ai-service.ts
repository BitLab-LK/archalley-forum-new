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

// Legacy available categories for fallback
const LEGACY_CATEGORIES = [
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
  categories?: string[]  // Multiple AI-suggested categories
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

export async function classifyPost(content: string, availableCategories?: string[]): Promise<AIClassification> {
  try {
    // Use passed categories or fallback to legacy categories
    const categories = availableCategories || LEGACY_CATEGORIES
    
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
    const prompt = `IMPORTANT: You must categorize this content into multiple relevant categories when applicable.

AVAILABLE CATEGORIES: ${categories.join(", ")}

CONTENT: "${translatedText}"

ANALYSIS INSTRUCTIONS:
1. Read the content carefully and identify ALL relevant topics
2. Select 1-3 categories that match the content themes
3. For business-related content about starting companies, budgeting, consulting → include "Business"
4. For construction, engineering, building, architecture → include "Construction" 
5. For career advice, job seeking, professional development → include "Career"
6. For design, aesthetics, visual concepts → include "Design"
7. For academic, research, educational content → include "Academic"
8. For tutorials, guides, informational content → include "Informative"

EXAMPLE MAPPINGS:
- "starting a construction company and budgeting" → ["Construction", "Business"]
- "career advice for civil engineers" → ["Career", "Construction"] 
- "freelance consulting in construction industry" → ["Business", "Career"]
- "interior design concepts" → ["Design"]

MANDATORY JSON RESPONSE FORMAT:
{
  "categories": ["Category1", "Category2"],
  "tags": ["relevant", "tags", "here"],
  "confidence": 0.9
}

CRITICAL: Always return categories as an array, even for single categories. If content clearly spans multiple domains, you MUST include multiple categories.`

    console.log("🤖 Calling Gemini API for classification...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()

    console.log("📝 Raw classification response:", responseText)

    // Parse the JSON response
    const classificationResponse = extractJsonFromMarkdown(responseText) as any
    
    console.log("🔍 Parsed classification response:", JSON.stringify(classificationResponse, null, 2))

    // Handle both old format (single category) and new format (multiple categories)
    let resultCategories: string[] = []
    
    if (Array.isArray(classificationResponse.categories)) {
      // New format with multiple categories
      resultCategories = classificationResponse.categories
      console.log("✅ Found categories array:", resultCategories)
    } else if (classificationResponse.category) {
      // Old format with single category - convert to array
      resultCategories = [classificationResponse.category]
      console.log("🔧 Converting single category to array:", resultCategories)
    } else {
      console.warn("❌ No categories found in response")
      resultCategories = ["Other"]
    }

    // Ensure we have tags
    const resultTags = Array.isArray(classificationResponse.tags) ? classificationResponse.tags : []
    
    console.log("🏷️ Final tags:", resultTags)

    // Validate and filter categories
    const validCategories = resultCategories
      .map((cat: string) => cat.trim())
      .map((cat: string) => {
        // Find exact match (case-insensitive)
        const matchedCategory = categories.find(
          (availableCat: string) => availableCat.toLowerCase() === cat.toLowerCase()
        )
        return matchedCategory || null
      })
      .filter((cat: string | null) => cat !== null) as string[]

    console.log("🔍 Valid categories after filtering:", validCategories)

    // If no valid categories found, use fallback logic
    if (validCategories.length === 0) {
      console.warn(`No valid categories found in response:`, resultCategories)
      console.warn(`Available categories:`, categories)
      
      // Try to find any category that contains the first suggested category as substring
      let fallbackCategory = "Other"
      if (resultCategories.length > 0) {
        const firstSuggestion = resultCategories[0].toLowerCase()
        const partialMatch = categories.find((cat: string) => 
          cat.toLowerCase().includes(firstSuggestion) || 
          firstSuggestion.includes(cat.toLowerCase())
        )
        if (partialMatch) {
          fallbackCategory = partialMatch
        }
      }
      
      validCategories.push(fallbackCategory)
      console.log(`Using fallback category: "${fallbackCategory}"`)
    }

    // Create final classification result with forced multiple categories for certain content
    let finalCategories = validCategories
    
    // FORCE multiple categories for known multi-domain content
    const contentLower = translatedText.toLowerCase()
    const hasConstruction = contentLower.includes('construction') || contentLower.includes('building') || contentLower.includes('engineering')
    const hasBusiness = contentLower.includes('business') || contentLower.includes('company') || contentLower.includes('budgeting') || contentLower.includes('management')
    const hasCareer = contentLower.includes('career') || contentLower.includes('job') || contentLower.includes('freelance') || contentLower.includes('consultant')
    const hasDesign = contentLower.includes('design') || contentLower.includes('interior') || contentLower.includes('architecture')
    const hasAcademic = contentLower.includes('degree') || contentLower.includes('student') || contentLower.includes('university') || contentLower.includes('study')
    
    console.log("🔍 Content analysis:", { hasConstruction, hasBusiness, hasCareer, hasDesign, hasAcademic })
    
    // Force multiple categories based on content analysis
    const forcedCategories = new Set(finalCategories)
    
    if (hasConstruction && hasBusiness && categories.includes('Construction') && categories.includes('Business')) {
      forcedCategories.add('Construction')
      forcedCategories.add('Business')
      console.log("🔧 FORCED: Adding Construction + Business")
    }
    if (hasCareer && hasAcademic && categories.includes('Career') && categories.includes('Academic')) {
      forcedCategories.add('Career')
      forcedCategories.add('Academic')
      console.log("🔧 FORCED: Adding Career + Academic")
    }
    if (hasCareer && hasBusiness && categories.includes('Career') && categories.includes('Business')) {
      forcedCategories.add('Career')
      forcedCategories.add('Business')
      console.log("🔧 FORCED: Adding Career + Business")
    }
    if (hasDesign && hasConstruction && categories.includes('Design') && categories.includes('Construction')) {
      forcedCategories.add('Design')
      forcedCategories.add('Construction')
      console.log("🔧 FORCED: Adding Design + Construction")
    }
    
    finalCategories = Array.from(forcedCategories)
    console.log("🎯 Final categories after forcing:", finalCategories)

    const classification: AIClassification = {
      category: finalCategories[0], // Primary category
      categories: finalCategories, // All suggested categories
      tags: resultTags || [],
      confidence: Math.min(Math.max(classificationResponse.confidence || 0.5, 0), 1),
      originalLanguage,
      translatedContent: translatedText
    }

    console.log("✅ Classification successful:", {
      primaryCategory: classification.category,
      allCategories: classification.categories,
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
      categories: ["Other"],
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
    const testResult = await classifyPost("This is a test post about architecture and design.", LEGACY_CATEGORIES)
    
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