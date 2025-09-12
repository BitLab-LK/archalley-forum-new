# Multi-Category Categorization Test Examples

## Testing the AI Categorization System

This document provides test examples to verify that the Gemini AI correctly suggests multiple relevant categories for different types of content.

## Test Categories Available
Based on your database schema, the system should have these categories:
- Business
- Design  
- Career
- Construction
- Academic
- Informative
- Other

## Test Examples

### 1. **Construction + Business Content**
**Test Content:**
```
I'm starting a construction company and need advice on project management software and budgeting for residential projects. What are the best practices for managing construction budgets and timelines while maintaining quality standards?
```

**Expected Categories:** Construction, Business
**Expected Tags:** project-management, budgeting, residential, construction-company, quality-standards

---

### 2. **Design + Construction Content**
**Test Content:**
```
Looking for modern architectural design trends for sustainable buildings. Interested in eco-friendly materials and innovative structural designs that combine aesthetics with environmental responsibility.
```

**Expected Categories:** Design, Construction
**Expected Tags:** architecture, sustainable-buildings, eco-friendly, materials, structural-design

---

### 3. **Career + Academic Content**
**Test Content:**
```
I'm pursuing a master's degree in civil engineering and looking for internship opportunities at architecture firms. What skills should I focus on to make myself competitive in the job market?
```

**Expected Categories:** Career, Academic
**Expected Tags:** civil-engineering, internship, architecture-firms, job-market, skills

---

### 4. **Business + Career Content**
**Test Content:**
```
cl
```

**Expected Categories:** Business, Career
**Expected Tags:** freelance, consulting, construction-industry, client-relationships, structural-engineering

---

### 5. **Pure Design Content**
**Test Content:**
```
Exploring minimalist interior design concepts for small spaces. Looking for color palette inspiration and furniture arrangement ideas that maximize functionality while maintaining aesthetic appeal.
```

**Expected Categories:** Design
**Expected Tags:** minimalist, interior-design, small-spaces, color-palette, furniture-arrangement

---

### 6. **Informative + Construction Content**
**Test Content:**
```
A comprehensive guide to understanding building codes and safety regulations for residential construction projects. This tutorial covers permit requirements, inspection processes, and compliance standards.
```

**Expected Categories:** Informative, Construction
**Expected Tags:** building-codes, safety-regulations, residential-construction, permits, compliance

---

### 7. **Academic + Design Content**
**Test Content:**
```
Research paper on the impact of biophilic design principles in modern architecture. Studying how natural elements integration affects human well-being in built environments.
```

**Expected Categories:** Academic, Design
**Expected Tags:** biophilic-design, modern-architecture, research, natural-elements, human-well-being

---

### 8. **Multi-Category Complex Content**
**Test Content:**
```
I'm a recent architecture graduate starting my own sustainable design consultancy. Need guidance on business planning, client acquisition, green building certifications, and academic research on sustainable materials for commercial projects.
```

**Expected Categories:** Career, Business, Design, Construction
**Expected Tags:** architecture-graduate, sustainable-design, consultancy, business-planning, green-building

---

## How to Test

### Method 1: Using the API Directly

1. **Test the Classification Endpoint:**
```bash
curl -X POST http://localhost:3000/api/ai/classify \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"content": "YOUR_TEST_CONTENT_HERE"}'
```

2. **Check Response Format:**
```json
{
  "category": "Primary Category",
  "categories": ["Category1", "Category2", "Category3"],
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "originalLanguage": "English",
  "translatedContent": "content..."
}
```

### Method 2: Using the Post Creator Interface

1. Go to your forum's post creation page
2. Paste any of the test contents above
3. Submit the post
4. Check the browser console for categorization logs
5. Verify the post appears in the correct categories

### Method 3: Testing Different Languages

**Spanish Content:**
```
Estoy buscando consejos sobre diseño de interiores para espacios pequeños y también necesito información sobre materiales de construcción sostenibles para mi nuevo proyecto residencial.
```

**Expected:** Should be translated to English and categorized as Design + Construction

## Validation Checklist

- [ ] AI suggests 1-3 relevant categories per content
- [ ] Categories match exactly with database categories
- [ ] Primary category is the most relevant one
- [ ] Tags are relevant and useful
- [ ] Confidence score is reasonable (0.7+)
- [ ] Non-English content is properly translated
- [ ] Fallback works when AI service fails
- [ ] Posts are stored with multiple category associations
- [ ] PostCategory junction table entries are created correctly

## Expected Behavior

1. **Multiple Categories:** Content spanning multiple domains should get 2-3 relevant categories
2. **Single Category:** Focused content should get 1 primary category
3. **Fallback:** Invalid or unclear content should fallback to "Other" category
4. **Database Integration:** Only categories that exist in your database should be suggested
5. **Language Support:** Non-English content should be translated and categorized correctly

## Debugging Tips

1. **Check Console Logs:** Look for categorization debug output
2. **Verify Database:** Ensure categories exist in your database
3. **Test API Key:** Verify Google Gemini API key is configured
4. **Check Responses:** Examine full API responses for unexpected formats
5. **Database Queries:** Verify PostCategory entries are created correctly

## Sample Test Script

You can also create a simple test script:

```javascript
// Test multiple contents
const testContents = [
  "Construction project management and business planning",
  "Interior design for modern offices", 
  "Career advice for architecture students",
  "Academic research on sustainable building materials"
];

for (const content of testContents) {
  const response = await fetch('/api/ai/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  
  const result = await response.json();
  console.log(`Content: ${content}`);
  console.log(`Categories: ${result.categories?.join(', ')}`);
  console.log(`Tags: ${result.tags?.join(', ')}`);
  console.log('---');
}
```