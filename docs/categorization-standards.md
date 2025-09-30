
// Categorization API Standards and Best Practices

1. FIELD USAGE STANDARDS:
   ✅ PRIMARY: Use 'categoryIds' for all categorization logic
   ✅ RELATION: Use 'categoryId' only for database relations
   ❌ DEPRECATED: Avoid 'aiCategory' and 'aiCategories'

2. VALIDATION REQUIREMENTS:
   - Always validate categoryId matches categoryIds[0]
   - Ensure categoryIds has 1-4 items
   - Verify all category IDs exist in database
   - Prevent duplicate categories in array

3. SECURITY CONSIDERATIONS:
   - Validate category ownership/permissions
   - Sanitize category inputs
   - Rate limit category updates
   - Log category changes for audit

4. PERFORMANCE OPTIMIZATIONS:
   - Use GIN index for categoryIds queries
   - Cache category lookups
   - Batch category updates
   - Minimize N+1 queries

5. ERROR HANDLING:
   - Graceful fallback for missing categories
   - Clear error messages for validation failures
   - Proper HTTP status codes
   - Detailed logging for debugging
