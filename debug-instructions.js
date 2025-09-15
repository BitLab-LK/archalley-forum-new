/**
 * Instructions for debugging the Sinhala categorization issue
 */

console.log(`
🐛 DEBUGGING SINHALA CATEGORIZATION ISSUE

The problem: Sinhala/Tamil posts are showing "Informative" instead of proper categories.

STEPS TO DEBUG:

1. 📝 CREATE A SINHALA POST IN THE BROWSER:
   - Go to http://localhost:3000
   - Create a post with: "මම නව ව්‍යාපාරයක් ආරම්භ කිරීමට සැලසුම් කරමි"
   - Watch the browser console AND server terminal

2. 🔍 CHECK BROWSER CONSOLE:
   - Should see: "🗣️ Detected language: Sinhala"
   - Should see: "📤 FormData being sent with originalLanguage: Sinhala"

3. 🖥️ CHECK SERVER TERMINAL:
   - Should see: "🤖 AI Service: Starting classification for content..."
   - Should see translation and categorization logs
   - Look for any error messages

4. 🚨 COMMON ISSUES TO CHECK:

   A) MISSING API KEY:
   - Look for: "⚠️ GOOGLE_GEMINI_API_KEY is not set"
   - Solution: Add GOOGLE_GEMINI_API_KEY to .env file

   B) NETWORK/API ERRORS:
   - Look for: "❌ AI classification error:" or "❌ Translation error:"
   - This means Gemini API is not reachable

   C) CATEGORY MAPPING ISSUE:
   - AI might be working but category names don't match database
   - Check if AI returns "Business" but database has different name

   D) FALLBACK BEHAVIOR:
   - AI service might be returning "Other" but frontend shows "Informative"
   - Check category selection logic

5. 🛠️ IMMEDIATE FIXES TO TRY:

   A) CHECK ENVIRONMENT VARIABLES:
   Add to .env file:
   GOOGLE_GEMINI_API_KEY=your_actual_api_key_here

   B) VERIFY API KEY WORKS:
   Test at: https://aistudio.google.com/app/apikey

   C) CHECK FALLBACK CATEGORIES:
   In lib/ai-service.ts, the FALLBACK_CATEGORIES includes "Informative"
   If AI fails, it might pick the second item in the array

6. 🔧 QUICK TEST:
   Create a post in English first: "I want to start a new business"
   If this also shows "Informative", the issue is broader than language detection.

Expected server logs for working system:
🗣️ Detected language: Sinhala → originalLanguage=Sinhala → 
🔄 Translation: "I plan to start a new business" → 
🤖 AI Classification: ["Business"] → 
✅ Post created with Business category

Let me know what you see in the logs!
`);