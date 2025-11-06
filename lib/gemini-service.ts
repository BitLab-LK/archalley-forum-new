import { GoogleGenerativeAI } from '@google/generative-ai'

// Build/runtime safe: don't throw at import time if key is missing
const genAI = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null

export interface CategorySuggestion {
  categories: string[]
  confidence: number
  reasoning: string
}

export class GeminiService {
  private model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null

  async categorizeContent(content: string, availableCategories: string[]): Promise<CategorySuggestion> {
    try {
      if (!this.model) {
        // Fallback when API key is not configured
        return {
          categories: availableCategories.slice(0, Math.min(2, availableCategories.length)),
          confidence: 0.2,
          reasoning: 'AI service unavailable; using fallback categories',
        }
      }
      const prompt = `
You are a content categorization AI for a professional construction and design forum. 

Analyze the following content and select the most relevant categories from the provided list. You can select multiple categories if the content spans multiple topics.

Available Categories:
${availableCategories.map(cat => `- ${cat}`).join('\n')}

Content to categorize:
"${content}"

Instructions:
1. Select 1-3 most relevant categories from the list above
2. Focus on the main topics and themes in the content
3. Consider both explicit mentions and implicit context
4. Return categories in order of relevance (most relevant first)

Respond in the following JSON format:
{
  "categories": ["Category1", "Category2"],
  "confidence": 0.85,
  "reasoning": "Brief explanation of why these categories were selected"
}

Categories should match exactly from the provided list. Confidence should be between 0 and 1.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const parsed = JSON.parse(jsonMatch[0]) as CategorySuggestion
      
      // Validate the response
      if (!Array.isArray(parsed.categories) || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid AI response format')
      }

      // Filter categories to ensure they exist in the available list
      const validCategories = parsed.categories.filter(cat => 
        availableCategories.includes(cat)
      )

      return {
        categories: validCategories,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1), // Clamp between 0 and 1
        reasoning: parsed.reasoning || 'AI categorization'
      }

    } catch (error) {
      console.error('Gemini categorization error:', error)
      
      // Fallback to "Other" category
      return {
        categories: ['Other'],
        confidence: 0.1,
        reasoning: 'Fallback due to AI service error'
      }
    }
  }

  async translateToEnglish(content: string, sourceLanguage?: string): Promise<string> {
    try {
      if (!this.model) {
        // If AI unavailable, return content as-is or a simple "translation"
        return content
      }
      const prompt = `
Translate the following text to English. If it's already in English, return it unchanged.
${sourceLanguage ? `Source language: ${sourceLanguage}` : ''}

Text to translate:
"${content}"

Instructions:
1. Provide only the English translation
2. Maintain the original meaning and tone
3. If already in English, return unchanged
4. Keep technical terms and proper nouns appropriate for a construction/design forum

Translation:
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const translation = response.text().trim()

      // Remove any quotes or formatting that might be added
      return translation.replace(/^["']|["']$/g, '')

    } catch (error) {
      console.error('Gemini translation error:', error)
      // Return original content if translation fails
      return content
    }
  }
}

export const geminiService = new GeminiService()
