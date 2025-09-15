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

// Fallback categories when database is unavailable
const FALLBACK_CATEGORIES = [
  "Design",
  "Informative", 
  "Business",
  "Career",
  "Construction",
  "Academic",
  "Jobs",
  "Other"
]

interface TranslationResult {
  translatedText: string
  detectedLanguage: string
}

interface AIClassification {
  category: string
  categories?: string[]
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
  console.log("🤖 AI Service: Starting classification for content:", content.substring(0, 100) + "...")
  console.log("📋 AI Service: Available categories:", availableCategories)
  
  try {
    const categories = availableCategories || FALLBACK_CATEGORIES
    
    if (!API_KEY || !model) {
      console.warn("⚠️ Google Gemini API key not configured, using fallback classification")
      return {
        category: "Other",
        categories: ["Other"],
        tags: [],
        confidence: 0,
        originalLanguage: "English",
        translatedContent: content
      }
    }

    // Step 1: Detect language and translate if needed
    const { translatedText, detectedLanguage } = await detectAndTranslate(content)
    const originalLanguage = detectedLanguage

    // Step 2: Analyze content for category and tags with improved prompt
    const prompt = `You are an expert content categorizer. Analyze the following content and classify it into appropriate categories.

AVAILABLE CATEGORIES (choose 1-3 most relevant):
${categories.map((cat, index) => `${index + 1}. ${cat}`).join('\n')}

CONTENT TO ANALYZE:
"${translatedText}"

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
- Use "Other" if content doesn't clearly fit available categories`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()

    // Parse the JSON response
    const classificationResponse = extractJsonFromMarkdown(responseText) as any

    // Handle both old format (single category) and new format (multiple categories)
    let resultCategories: string[] = []
    
    if (Array.isArray(classificationResponse.categories)) {
      resultCategories = classificationResponse.categories
    } else if (classificationResponse.category) {
      resultCategories = [classificationResponse.category]
    } else {
      resultCategories = ["Other"]
    }

    const resultTags = Array.isArray(classificationResponse.tags) ? classificationResponse.tags : []

    // Validate and filter categories with improved matching
    const validCategories = resultCategories
      .map((cat: string) => cat.trim())
      .map((cat: string) => {
        // First try exact match (case-insensitive)
        const exactMatch = categories.find(
          (availableCat: string) => availableCat.toLowerCase() === cat.toLowerCase()
        )
        if (exactMatch) return exactMatch
        
        // Try partial match for common variations
        const partialMatch = categories.find((availableCat: string) => {
          const availableLower = availableCat.toLowerCase()
          const catLower = cat.toLowerCase()
          return availableLower.includes(catLower) || catLower.includes(availableLower)
        })
        
        return partialMatch || null
      })
      .filter((cat: string | null) => cat !== null) as string[]

    console.log("🔍 AI Category Validation:", {
      aiSuggested: resultCategories,
      availableCategories: categories,
      validMatches: validCategories
    })

    // If no valid categories found, use intelligent fallback logic
    if (validCategories.length === 0) {
      console.log("⚠️ No valid AI categories found, using content analysis fallback")
      
      // Try to match content to categories using keyword analysis
      const contentLower = translatedText.toLowerCase()
      const fallbackCategories: string[] = []
      
      // Define keyword mappings for each category (using available categories)
      const categoryKeywords: Record<string, string[]> = {}
      
      // Dynamically build keyword mappings based on available categories
      categories.forEach(category => {
        const categoryLower = category.toLowerCase()
        switch (categoryLower) {
          case 'design':
            categoryKeywords[category] = ['design', 'art', 'creative', 'visual', 'aesthetic', 'layout', 'graphic', 'ui', 'ux', 'color', 'style', 'beautiful', 'elegant', 'interior']
            break
          case 'business':
            categoryKeywords[category] = ['business', 'company', 'startup', 'entrepreneur', 'management', 'finance', 'marketing', 'strategy', 'profit', 'revenue', 'client', 'customer', 'commercial']
            break
          case 'career':
            categoryKeywords[category] = ['career', 'professional', 'skill', 'development', 'networking', 'freelance', 'consultant', 'interview', 'resume', 'promotion', 'workplace', 'growth']
            break
          case 'construction':
            categoryKeywords[category] = ['construction', 'building', 'engineering', 'project', 'contractor', 'infrastructure', 'renovation', 'planning', 'materials', 'structural', 'architecture']
            break
          case 'academic':
            categoryKeywords[category] = ['academic', 'research', 'study', 'university', 'education', 'school', 'degree', 'student', 'learning', 'knowledge', 'thesis']
            break
          case 'jobs':
            categoryKeywords[category] = ['job', 'hiring', 'vacancy', 'opportunity', 'employment', 'position', 'recruit', 'opening', 'work', 'apply']
            break
          case 'informative':
            categoryKeywords[category] = ['information', 'guide', 'tutorial', 'how to', 'tips', 'advice', 'facts', 'knowledge', 'learn', 'educational']
            break
          default:
            categoryKeywords[category] = [categoryLower]
        }
      })
      
      // Score each category based on keyword matches
      const categoryScores: Record<string, number> = {}
      
      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        const score = keywords.reduce((total, keyword) => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
          const matches = contentLower.match(regex)
          return total + (matches ? matches.length : 0)
        }, 0)
        
        if (score > 0) {
          categoryScores[category] = score
        }
      })
      
      // Select top scoring categories (max 2)
      const sortedCategories = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([category,]) => category)
      
      if (sortedCategories.length > 0) {
        fallbackCategories.push(...sortedCategories)
        console.log("✅ Content analysis found categories:", fallbackCategories)
      } else {
        fallbackCategories.push("Other")
        console.log("📂 No content matches found, using 'Other' category")
      }
      
      validCategories.push(...fallbackCategories)
    }

    // Remove duplicates and ensure we have at least one category
    const finalCategories = [...new Set(validCategories)]
    if (finalCategories.length === 0) {
      finalCategories.push("Other")
    }

    // Limit to maximum 3 categories
    const limitedCategories = finalCategories.slice(0, 3)

    const classification: AIClassification = {
      category: limitedCategories[0], // Primary category
      categories: limitedCategories, // All suggested categories
      tags: resultTags || [],
      confidence: Math.min(Math.max(classificationResponse.confidence || 0.5, 0), 1),
      originalLanguage,
      translatedContent: translatedText
    }

    console.log("✅ AI Service: Final classification result:", classification)
    return classification

  } catch (error) {
    console.error("❌ AI classification error:", error)
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
    const testResult = await classifyPost("This is a test post about architecture and design.", FALLBACK_CATEGORIES)
    
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