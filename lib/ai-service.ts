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

// Cache for AI classification results to improve performance
class AICache {
  private cache = new Map<string, { result: AIClassification, timestamp: number }>()
  private readonly maxSize = 1000 // Maximum cache entries
  private readonly ttl = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  // Generate cache key from content and categories
  private generateKey(content: string, categories?: string[]): string {
    const normalizedContent = content.trim().toLowerCase().substring(0, 500) // First 500 chars for key
    const categoriesKey = categories ? categories.sort().join(',') : 'default'
    return Buffer.from(`${normalizedContent}:${categoriesKey}`).toString('base64').substring(0, 100)
  }

  // Get cached result if valid
  get(content: string, categories?: string[]): AIClassification | null {
    const key = this.generateKey(content, categories)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    console.log("✅ AI Cache: Using cached classification for content:", content.substring(0, 50) + "...")
    return cached.result
  }

  // Store result in cache
  set(content: string, result: AIClassification, categories?: string[]): void {
    const key = this.generateKey(content, categories)
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKeys = Array.from(this.cache.keys())
      if (oldestKeys.length > 0) {
        this.cache.delete(oldestKeys[0])
      }
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    })
    
    console.log("💾 AI Cache: Stored classification for content:", content.substring(0, 50) + "...")
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats
  getStats(): { size: number, maxSize: number, hitRate: string } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 'N/A' // Could implement hit rate tracking if needed
    }
  }
}

// Global cache instance
const aiCache = new AICache()

// Cleanup expired cache entries every hour
setInterval(() => {
  aiCache.cleanup()
}, 60 * 60 * 1000)

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

/**
 * Enhanced language detection and translation function with improved Sinhala support
 * @param text - Text content to analyze and potentially translate
 * @returns Promise<TranslationResult> - Translation result with detected language
 */
async function detectAndTranslate(text: string): Promise<TranslationResult> {
  console.log("🔄 Translation: Starting enhanced translation for text:", text.substring(0, 50) + "...")
  
  // Check if API key and model are available
  if (!API_KEY || !model) {
    console.warn("⚠️ Google Gemini API key not configured, skipping translation")
    return {
      translatedText: text,
      detectedLanguage: "English"
    }
  }

  // Enhanced prompt with better Sinhala language recognition
  const prompt = `You are an expert linguist. Analyze the following text carefully:

1. First, detect the exact language of the text
2. If it's not English, translate it to English while preserving the original meaning and context
3. Pay special attention to:
   - Sinhala (සිංහල) text - common in Sri Lankan content
   - Technical terms related to architecture, design, business, construction
   - Educational and professional content

Text to analyze: "${text}"

IMPORTANT INSTRUCTIONS:
- For Sinhala text, provide accurate English translation
- Preserve technical terminology and professional context
- Maintain the original intent and meaning
- If already in English, return the original text

Return ONLY a JSON response in this exact format:
{
  "translatedText": "the accurate English translation or original text",
  "detectedLanguage": "the detected language (e.g., 'Sinhala', 'English', 'Tamil', etc.)"
}`

  try {
    console.log("🤖 Translation: Sending request to Gemini...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()
    
    console.log("📥 Translation: Raw response from Gemini:", responseText)
    
    const data = extractJsonFromMarkdown(responseText)
    console.log("📋 Translation: Parsed data:", data)

    if (!data.translatedText || !data.detectedLanguage) {
      console.warn("⚠️ Translation response missing required fields:", data)
      return {
        translatedText: text,
        detectedLanguage: "English"
      }
    }

    console.log("✅ Translation: Success!", {
      original: text.substring(0, 30) + "...",
      translated: data.translatedText,
      detectedLanguage: data.detectedLanguage
    })

    return {
      translatedText: data.translatedText,
      detectedLanguage: data.detectedLanguage
    }
  } catch (error) {
    console.error("❌ Enhanced translation error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown translation error",
      text: text.substring(0, 50) + "...",
      timestamp: new Date().toISOString(),
      apiKeyPresent: !!API_KEY,
      modelInitialized: !!model
    })
    
    // Enhanced fallback handling for translation failures
    console.log("🔄 Translation failed, analyzing content for language detection fallback...")
    
    // Simple language detection fallback based on character sets
    let detectedLanguage = "English"
    
    // Check for Sinhala characters (Unicode range: 0D80-0DFF)
    if (/[\u0D80-\u0DFF]/.test(text)) {
      detectedLanguage = "Sinhala"
      console.log("✅ Fallback detection: Sinhala characters found")
    }
    // Check for Tamil characters (Unicode range: 0B80-0BFF)
    else if (/[\u0B80-\u0BFF]/.test(text)) {
      detectedLanguage = "Tamil"
      console.log("✅ Fallback detection: Tamil characters found")
    }
    // Check for other common non-Latin scripts
    else if (/[\u0900-\u097F]/.test(text)) {
      detectedLanguage = "Hindi"
      console.log("✅ Fallback detection: Hindi/Devanagari characters found")
    }
    else if (/[\u4E00-\u9FFF]/.test(text)) {
      detectedLanguage = "Chinese"
      console.log("✅ Fallback detection: Chinese characters found")
    }
    else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
      detectedLanguage = "Japanese"
      console.log("✅ Fallback detection: Japanese characters found")
    }
    
    console.log(`🔄 Using fallback language detection: ${detectedLanguage}`)
    
    // Return original text with detected language for better categorization
    return {
      translatedText: text,
      detectedLanguage: detectedLanguage
    }
  }
}

export async function classifyPost(content: string, availableCategories?: string[]): Promise<AIClassification> {
  console.log("🤖 AI Service: Starting classification for content:", content.substring(0, 100) + "...")
  console.log("📋 AI Service: Available categories:", availableCategories)
  
  try {
    const categories = availableCategories || FALLBACK_CATEGORIES
    
    // Check cache first
    const cachedResult = aiCache.get(content, categories)
    if (cachedResult) {
      console.log("⚡ AI Service: Using cached result")
      return cachedResult
    }
    
    if (!API_KEY || !model) {
      console.warn("⚠️ Google Gemini API key not configured, using fallback classification")
      const fallbackResult: AIClassification = {
        category: "Other",
        categories: ["Other"],
        tags: [],
        confidence: 0,
        originalLanguage: "English",
        translatedContent: content
      }
      // Don't cache fallback results
      return fallbackResult
    }

    // Step 1: Detect language and translate if needed
    const { translatedText, detectedLanguage } = await detectAndTranslate(content)
    const originalLanguage = detectedLanguage

    // Step 2: Enhanced content analysis with improved categorization for non-English content
    const prompt = `You are an expert content categorizer specializing in multi-language content analysis. 

AVAILABLE CATEGORIES (choose 1-3 most relevant):
${categories.map((cat, index) => `${index + 1}. ${cat}`).join('\n')}

CONTENT TO ANALYZE:
Original Language: ${originalLanguage}
Content: "${translatedText}"

ENHANCED CLASSIFICATION RULES:
1. Select 1-3 most relevant categories from the list above
2. Categories must match EXACTLY as written in the list (case-sensitive)
3. For non-English content (especially Sinhala), consider cultural and regional context
4. Pay special attention to:
   - Professional and educational content → Academic, Career
   - Architecture and construction topics → Design, Construction
   - Business and entrepreneurship → Business, Career
   - Informational and tutorial content → Informative
   - Job-related posts → Jobs, Career
5. IMPORTANT: Don't default to "Informative" unless content is genuinely informational
6. Multiple categories are encouraged when content spans multiple domains

CONTENT ANALYSIS EXAMPLES:
- Educational content about architecture → ["Academic", "Design"]
- Business planning for construction → ["Business", "Construction"]
- Career advice for designers → ["Career", "Design"]
- Job posting for architect → ["Jobs", "Career", "Design"]
- Tutorial on business planning → ["Informative", "Business"]

SPECIAL CONSIDERATION FOR NON-ENGLISH CONTENT:
- Original language was: ${originalLanguage}
- Translated content often contains professional/educational themes
- Don't assume "Informative" category just because it was translated
- Analyze the actual content meaning and context

Return your response as JSON in this exact format:
{
  "categories": ["Category1", "Category2", "Category3"],
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "confidence": 0.85,
  "reasoning": "Brief explanation of why these categories were chosen"
}

Requirements:
- "categories" array must contain 1-3 exact category names from the list above
- "tags" should be 3-7 relevant keywords from the content
- "confidence" should be between 0.1 and 1.0
- "reasoning" should explain the categorization logic
- Use multiple categories when content is multi-dimensional`

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

    // Enhanced validation and filtering for categories with improved matching
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

    console.log("🔍 Enhanced AI Category Validation:", {
      originalLanguage,
      aiSuggested: resultCategories,
      availableCategories: categories,
      validMatches: validCategories,
      translationUsed: originalLanguage !== "English"
    })

    // Enhanced fallback logic for non-English content
    if (validCategories.length === 0) {
      console.log("⚠️ No valid AI categories found, using enhanced content analysis fallback")
      
      // Enhanced keyword-based categorization for non-English content
      const contentLower = translatedText.toLowerCase()
      const fallbackCategories: string[] = []
      
      // Enhanced keyword mappings with more comprehensive terms
      const categoryKeywords: Record<string, string[]> = {}
      
      // Dynamically build enhanced keyword mappings
      categories.forEach(category => {
        const categoryLower = category.toLowerCase()
        switch (categoryLower) {
          case 'design':
            categoryKeywords[category] = ['design', 'art', 'creative', 'visual', 'aesthetic', 'layout', 'graphic', 'ui', 'ux', 'color', 'style', 'beautiful', 'elegant', 'interior', 'architecture', 'architectural', 'building design', 'space planning', 'form', 'function']
            break
          case 'business':
            categoryKeywords[category] = ['business', 'company', 'startup', 'entrepreneur', 'management', 'finance', 'marketing', 'strategy', 'profit', 'revenue', 'client', 'customer', 'commercial', 'enterprise', 'organization', 'planning', 'development']
            break
          case 'career':
            categoryKeywords[category] = ['career', 'professional', 'skill', 'development', 'networking', 'freelance', 'consultant', 'interview', 'resume', 'promotion', 'workplace', 'growth', 'opportunity', 'advancement', 'experience', 'profession']
            break
          case 'construction':
            categoryKeywords[category] = ['construction', 'building', 'engineering', 'project', 'contractor', 'infrastructure', 'renovation', 'planning', 'materials', 'structural', 'architecture', 'civil', 'site', 'foundation', 'concrete', 'steel']
            break
          case 'academic':
            categoryKeywords[category] = ['academic', 'research', 'study', 'university', 'education', 'school', 'degree', 'student', 'learning', 'knowledge', 'thesis', 'scholarship', 'course', 'curriculum', 'educational', 'teaching']
            break
          case 'jobs':
            categoryKeywords[category] = ['job', 'hiring', 'vacancy', 'opportunity', 'employment', 'position', 'recruit', 'opening', 'work', 'apply', 'career', 'salary', 'benefits']
            break
          case 'informative':
            categoryKeywords[category] = ['information', 'guide', 'tutorial', 'how to', 'tips', 'advice', 'facts', 'knowledge', 'learn', 'educational', 'instruction', 'explanation', 'method', 'technique']
            break
          default:
            categoryKeywords[category] = [categoryLower, category.replace(/[^a-zA-Z]/g, '').toLowerCase()]
        }
      })
      
      // Enhanced scoring with weighted keywords and phrase matching
      const categoryScores: Record<string, number> = {}
      
      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        let score = 0
        
        keywords.forEach(keyword => {
          // Exact word boundary matches (higher weight)
          const exactRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi')
          const exactMatches = contentLower.match(exactRegex)
          if (exactMatches) {
            score += exactMatches.length * 2 // Higher weight for exact matches
          }
          
          // Partial matches (lower weight)
          if (contentLower.includes(keyword.toLowerCase())) {
            score += 0.5
          }
        })
        
        if (score > 0) {
          categoryScores[category] = score
        }
      })
      
      // Select top scoring categories (max 2 for fallback)
      const sortedCategories = Object.entries(categoryScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([category,]) => category)
      
      if (sortedCategories.length > 0) {
        fallbackCategories.push(...sortedCategories)
        console.log("✅ Enhanced content analysis found categories:", fallbackCategories, "with scores:", categoryScores)
      } else {
        // Special handling for non-English content - don't default to "Other" too quickly
        if (originalLanguage !== "English" && translatedText.length > 20) {
          // For substantial non-English content, try common category assignment
          const commonCategories = ['Informative', 'Career', 'Business'].filter(cat => categories.includes(cat))
          if (commonCategories.length > 0) {
            fallbackCategories.push(commonCategories[0])
            console.log("📋 Non-English content assigned common category:", fallbackCategories)
          } else {
            fallbackCategories.push("Other")
          }
        } else {
          fallbackCategories.push("Other")
          console.log("📂 No content matches found, using 'Other' category")
        }
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

    // Cache the result if confidence is reasonable
    if (classification.confidence > 0.3) {
      aiCache.set(content, classification, categories)
    }

    console.log("✅ AI Service: Final classification result:", classification)
    return classification

  } catch (error) {
    console.error("❌ Enhanced AI classification error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown classification error",
      stack: error instanceof Error ? error.stack : undefined,
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + "...",
      availableCategories: availableCategories?.length || 0,
      timestamp: new Date().toISOString(),
      apiKeyPresent: !!API_KEY,
      modelInitialized: !!model
    })
    
    // Enhanced error recovery with intelligent fallback
    console.log("🔄 AI classification failed, implementing enhanced error recovery...")
    
    // Try to detect language from content for better fallback categorization
    let detectedLanguage = "English"
    if (/[\u0D80-\u0DFF]/.test(content)) {
      detectedLanguage = "Sinhala"
    } else if (/[\u0B80-\u0BFF]/.test(content)) {
      detectedLanguage = "Tamil" 
    }
    
    // Enhanced fallback categorization based on content analysis
    const categories = availableCategories || FALLBACK_CATEGORIES
    const contentLower = content.toLowerCase()
    let fallbackCategory = "Other"
    let fallbackCategories = ["Other"]
    
    // Try intelligent keyword-based categorization even during errors
    const categoryKeywordMatches: Record<string, number> = {}
    
    categories.forEach(category => {
      const categoryLower = category.toLowerCase()
      let score = 0
      
      // Enhanced keyword detection for error recovery
      switch (categoryLower) {
        case 'design':
        case 'informative':
          if (contentLower.includes('design') || contentLower.includes('architecture') ||
              contentLower.includes('පරිසර') || contentLower.includes('සැලසුම') ||
              contentLower.includes('building') || contentLower.includes('art')) {
            score += 2
          }
          break
        case 'business':
          if (contentLower.includes('business') || contentLower.includes('ව්‍යාපාර') ||
              contentLower.includes('company') || contentLower.includes('entrepreneur')) {
            score += 2
          }
          break
        case 'career':
          if (contentLower.includes('career') || contentLower.includes('job') ||
              contentLower.includes('වෘත්තීය') || contentLower.includes('රැකියා')) {
            score += 2
          }
          break
        case 'academic':
          if (contentLower.includes('education') || contentLower.includes('university') ||
              contentLower.includes('අධ්‍යාපන') || contentLower.includes('research')) {
            score += 2
          }
          break
      }
      
      if (score > 0) {
        categoryKeywordMatches[category] = score
      }
    })
    
    // Select best matching categories for error recovery
    const sortedMatches = Object.entries(categoryKeywordMatches)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
    
    if (sortedMatches.length > 0) {
      fallbackCategories = sortedMatches.map(([category,]) => category)
      fallbackCategory = fallbackCategories[0]
      console.log("✅ Enhanced error recovery found categories:", fallbackCategories)
    } else {
      // For non-English content, prefer common categories over "Other"
      if (detectedLanguage !== "English" && categories.includes("Informative")) {
        fallbackCategory = "Informative"
        fallbackCategories = ["Informative"]
        console.log("🌍 Non-English content error recovery: using Informative category")
      }
    }
    
    const errorResult: AIClassification = {
      category: fallbackCategory,
      categories: fallbackCategories,
      tags: [],
      confidence: 0,
      originalLanguage: detectedLanguage,
      translatedContent: content
    }
    
    console.log("🔄 Enhanced error recovery result:", errorResult)
    
    // Don't cache error results but provide meaningful fallback
    return errorResult
  }
}

/**
 * Enhanced test function to verify AI service functionality with multi-language support
 * @returns Promise<boolean> - Success status of the test
 */
export async function testAIService(): Promise<boolean> {
  try {
    if (!API_KEY || !model) {
      console.log("❌ AI service not available - no API key")
      return false
    }

    console.log("🧪 Testing enhanced AI service with multi-language support...")
    
    // Test 1: English content
    const englishTest = await classifyPost("This is a test post about architecture and design.", FALLBACK_CATEGORIES)
    console.log("✅ English test result:", englishTest)
    
    // Test 2: Sinhala content (if API key is available)
    const sinhalaTest = await classifyPost("අධ්‍යාපන සහ ව්‍යාපාරික පරිසර දෙකම යහපත් සැලසුමක් අවශ්‍ය කරයි", FALLBACK_CATEGORIES)
    console.log("✅ Sinhala test result:", sinhalaTest)
    
    // Validate results
    const englishValid = englishTest.category && (englishTest.categories?.length || 0) > 0
    const sinhalaValid = sinhalaTest.category && sinhalaTest.originalLanguage === "Sinhala"
    
    if (englishValid && sinhalaValid) {
      console.log("✅ Enhanced AI service test successful - multi-language support working")
      return true
    } else {
      console.log("❌ Enhanced AI service test failed - some functionality not working")
      console.log("English valid:", englishValid, "Sinhala valid:", sinhalaValid)
      return false
    }
  } catch (error) {
    console.error("❌ Enhanced AI service test failed:", error)
    return false
  }
}

/**
 * Test function specifically for Sinhala content categorization
 * @param content - Sinhala content to test
 * @param categories - Available categories to test against
 * @returns Promise<AIClassification> - AI classification result
 */
export async function testSinhalaClassification(content: string, categories?: string[]): Promise<AIClassification> {
  console.log("🇱🇰 Testing Sinhala content classification...")
  console.log("📝 Content:", content)
  console.log("📋 Available categories:", categories || FALLBACK_CATEGORIES)
  
  try {
    const result = await classifyPost(content, categories || FALLBACK_CATEGORIES)
    console.log("🎯 Sinhala classification result:", {
      detectedLanguage: result.originalLanguage,
      categories: result.categories,
      primaryCategory: result.category,
      confidence: result.confidence,
      hasTranslation: result.translatedContent !== content
    })
    return result
  } catch (error) {
    console.error("❌ Sinhala classification test failed:", error)
    throw error
  }
} 