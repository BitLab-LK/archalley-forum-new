# Production Debugging Guide

## Issue: Posts load locally but not on deployed domain

### Quick Diagnosis Steps

1. **Check Health Endpoint**
   ```
   https://yourdomain.com/api/health
   ```
   This will show:
   - Database connectivity
   - Environment variables
   - Post count

2. **Check Posts API Directly**
   ```
   https://yourdomain.com/api/posts?page=1&limit=10
   ```

3. **Check Browser Console**
   - Open DevTools → Console
   - Look for error messages
   - Check Network tab for failed requests

### Common Causes & Solutions

#### 1. Database Connection Issues
**Symptoms**: 503 errors, "Database service temporarily unavailable"
**Causes**:
- Wrong DATABASE_URL in production environment
- Database not accessible from production server
- Connection pool exhausted

**Fix**:
- Verify DATABASE_URL is correctly set in production environment
- Ensure database allows connections from production server IP
- Check database connection limits

#### 2. Environment Variables Missing
**Symptoms**: 500 errors, authentication issues
**Check**: All required environment variables are set in production:
- `DATABASE_URL`
- `NEXTAUTH_URL` (should be your production domain)
- `NEXTAUTH_SECRET`
- Other required variables from env.example

#### 3. Server-Side Rendering (SSR) Failures
**Symptoms**: Empty page, no posts, but no obvious errors
**Causes**:
- Database query failing during build/SSR
- Timeout during server-side data fetching

**Fix**: The code now includes fallback mechanisms

#### 4. Build-time vs Runtime Issues
**Symptoms**: Works in development, fails in production
**Causes**:
- Static generation trying to connect to local database
- Environment variables not available during build

### Debugging Commands

Run these on your deployed domain:

1. **Health Check**:
   ```
   curl https://yourdomain.com/api/health
   ```

2. **Posts API Test**:
   ```
   curl https://yourdomain.com/api/posts
   ```

3. **Check Server Logs** (platform-specific):
   - Vercel: `vercel logs yourdomain.com`
   - Netlify: Check Functions logs
   - Railway/Render: Check application logs

### Environment Variables Checklist

Ensure these are set in production:

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth (CRITICAL - must be production domain)
NEXTAUTH_URL="https://yourdomain.com"  # NOT localhost!
NEXTAUTH_SECRET="your-secret-32-chars-minimum"

# OAuth (if using)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Other services
GEMINI_API_KEY="..." (if using AI features)
```

### Most Likely Fixes

1. **Fix NEXTAUTH_URL**: Ensure it's set to your production domain
2. **Check DATABASE_URL**: Verify it's correct for production database
3. **Database Permissions**: Ensure production server can connect to database
4. **Clear Build Cache**: Force rebuild with fresh environment variables

### Testing the Fix

After applying fixes:

1. Clear build cache and redeploy
2. Test `/api/health` endpoint
3. Test `/api/posts` endpoint  
4. Check homepage loads with posts
5. Verify browser console shows no errors

The improvements made to the code include:
- Better error handling and logging
- Fallback mechanisms for SSR failures
- Automatic client-side fetch if SSR fails
- Health check endpoint for debugging
- More detailed error messages