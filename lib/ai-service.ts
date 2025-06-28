import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  }
})

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
  // Remove markdown code block syntax if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
  const jsonStr = jsonMatch[1].trim()
  
  try {
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error("Failed to parse JSON:", jsonStr)
    throw new Error("Invalid JSON response from AI")
  }
}

async function detectAndTranslate(text: string): Promise<TranslationResult> {
  // Check if API key is available
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
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
    const data = extractJsonFromMarkdown(response.text())

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
    console.error("Translation error:", {
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
    // Check if API key is available
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn("Google Gemini API key not configured, using default classification")
      return {
        category: "Other",
        tags: [],
        confidence: 0,
        originalLanguage: "English",
        translatedContent: content
      }
    }

    // Step 1: Detect language and translate if needed
    const { translatedText, detectedLanguage } = await detectAndTranslate(content)
    const originalLanguage = detectedLanguage

    // Step 2: Analyze content for category and tags
    const prompt = `Analyze the following text and determine the most appropriate category and generate relevant tags. The category must be one of: ${AVAILABLE_CATEGORIES.join(", ")}.

Category descriptions:
- Business: Business strategies, entrepreneurship, and industry trends in architecture and construction
- Design: Architectural designs, concepts, and creative inspiration
- Career: Career advice, job opportunities, and professional development
- Construction: Construction techniques, materials, project management, and innovations
- Academic: Academic discussions, research, theories, and educational resources
- Informative: News, updates, tutorials, and informational content
- Other: General discussions that don't fit other categories

Text: "${translatedText}"

Return the response in this exact JSON format:
{
  "category": "one of the available categories",
  "tags": ["array", "of", "relevant", "tags"],
  "confidence": 0.95
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()

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
    if (!AVAILABLE_CATEGORIES.includes(normalizedCategory)) {
      console.warn(`Invalid category "${normalizedCategory}", available categories:`, AVAILABLE_CATEGORIES)
      classification.category = "Other"
      classification.confidence = 0.5
    } else {
      classification.category = normalizedCategory
    }

    // Add translation info
    classification.originalLanguage = originalLanguage
    classification.translatedContent = translatedText

    return classification
  } catch (error) {
    console.error("AI classification error:", {
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