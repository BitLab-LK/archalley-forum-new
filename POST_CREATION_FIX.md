# Post Creation API Error Fix

## Problem: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when your API endpoints return HTML error pages instead of JSON responses.

## Quick Fix Steps

### 1. Test Your Deployment
```powershell
# Run this diagnostic script
.\scripts\test-deployment-api.ps1 -DeploymentUrl "https://your-domain.com"
```

### 2. Check Environment Variables
Make sure these are set in your deployment platform:

```env
# REQUIRED - Database
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require

# REQUIRED - Authentication
NEXTAUTH_URL=https://your-exact-deployment-domain.com
NEXTAUTH_SECRET=your-32-character-random-string

# OPTIONAL - File uploads
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx

# OPTIONAL - OAuth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Test Individual Endpoints

Test these URLs directly in your browser:

1. **Basic API Test**: `https://your-domain.com/api/test`
   - Should return: `{"status":"ok","timestamp":"..."}`
   - If you see HTML: Your API routes aren't working

2. **Health Check**: `https://your-domain.com/api/health`
   - Should return: `{"status":"ok"}`
   - If 404: Your deployment is missing files

3. **Categories**: `https://your-domain.com/api/categories`
   - Should return: `{"categories":[...]}`
   - If error: Database issues

### 4. Common Fixes

#### Fix 1: Redeploy with Latest Code
```bash
git add .
git commit -m "Fix API error handling"
git push
```

#### Fix 2: Check NEXTAUTH_URL
```env
# Wrong
NEXTAUTH_URL=http://localhost:3000

# Correct (use your exact domain)
NEXTAUTH_URL=https://forum-dev.archalley.com
```

#### Fix 3: Database Connection
```env
# Ensure your DATABASE_URL includes SSL and timeout
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&connect_timeout=60
```

#### Fix 4: Check Middleware
If authentication is blocking requests, the middleware should allow POST to `/api/posts` for authenticated users.

### 5. Debugging Steps

1. **Check deployment logs** for errors during startup
2. **Test authentication** by logging into your deployed site
3. **Try creating a post** while logged in
4. **Check browser network tab** to see the exact API response

### 6. Platform-Specific Notes

#### Vercel
- Check "Functions" tab for API route errors
- Ensure environment variables are set in project settings
- Check that your domain is correctly configured

#### Netlify
- Check "Functions" logs
- Ensure serverless functions are enabled
- Check build logs for errors

#### Railway/Render
- Check application logs
- Ensure database is accessible from app
- Check environment variable configuration

## Still Having Issues?

If the diagnostic script shows API endpoints are working but post creation fails:

1. **Check user authentication**: Make sure you're logged in
2. **Check categories**: Ensure at least one category exists
3. **Check file uploads**: If uploading images, ensure blob storage is configured
4. **Check console logs**: Look for specific error messages in browser console

## Contact Support

If none of these fixes work, provide:
1. Results from the diagnostic script
2. Browser console errors
3. Deployment platform (Vercel/Netlify/etc.)
4. Deployment logs if available
