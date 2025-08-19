# Deployment Troubleshooting Guide

## Common Deployment Issues

### 1. "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Cause**: API endpoints are returning HTML (error pages) instead of JSON responses.

**Solutions**:

1. **Check Authentication Configuration**:
   ```env
   NEXTAUTH_URL=https://yourdomain.com  # Must match your deployment URL
   NEXTAUTH_SECRET=your-32-character-secret
   ```

2. **Verify Database Connection**:
   ```env
   DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
   ```

3. **Test API Endpoints**:
   - Visit: `https://yourdomain.com/api/debug/deployment`
   - Check: `https://yourdomain.com/api/health`

4. **Check Middleware Configuration**:
   - Ensure API routes are not being blocked
   - Verify authentication tokens are being passed correctly

### 2. "Failed to parse response"

**Cause**: Response is not valid JSON or is an error page.

**Solutions**:

1. **Enable Better Error Logging**:
   - Check your deployment platform's logs
   - Look for server-side errors in the console

2. **Verify Environment Variables**:
   ```bash
   # Check all required variables are set
   echo $DATABASE_URL
   echo $NEXTAUTH_URL
   echo $NEXTAUTH_SECRET
   echo $BLOB_READ_WRITE_TOKEN
   ```

3. **Test Database Connectivity**:
   ```bash
   # Run Prisma commands
   npx prisma db push
   npx prisma generate
   ```

### 3. Image Upload Issues

**Cause**: Vercel Blob storage configuration or authentication issues.

**Solutions**:

1. **Configure Vercel Blob**:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
   ```

2. **Check Upload Endpoints**:
   - Ensure `/api/upload/blob` is accessible
   - Verify file size and type restrictions

3. **Update Middleware**:
   ```typescript
   // Allow upload endpoints
   if (req.nextUrl.pathname.startsWith("/api/upload")) {
     return !!token
   }
   ```

## Quick Deployment Checklist

### Environment Variables (Required)
- [ ] `DATABASE_URL` - Production database connection string
- [ ] `NEXTAUTH_URL` - Your deployment domain (https://yourdomain.com)
- [ ] `NEXTAUTH_SECRET` - Random 32+ character string
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

### OAuth Setup (Optional)
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- [ ] `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`
- [ ] `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET`

### Database Setup
- [ ] Run migrations: `npx prisma db push`
- [ ] Generate client: `npx prisma generate`
- [ ] Seed data (optional): `npm run seed`

### Build Verification
- [ ] No build errors in deployment logs
- [ ] All dependencies installed correctly
- [ ] TypeScript compilation successful

## Debugging Steps

### 1. Test API Endpoints
```bash
# Test basic connectivity
curl https://yourdomain.com/api/health

# Test authentication
curl https://yourdomain.com/api/debug/deployment

# Test database
curl -X POST https://yourdomain.com/api/posts \
  -H "Content-Type: multipart/form-data" \
  -F "content=test" \
  -F "categoryId=valid-category-id"
```

### 2. Check Logs
- **Vercel**: Check Function Logs in dashboard
- **Netlify**: Check Functions tab for errors  
- **Railway**: Check deployment logs
- **Other**: Check your platform's logging system

### 3. Local vs Production Differences
- Environment variables setup
- Database connection (local vs production)
- SSL requirements for database
- Domain/URL differences
- File upload configurations

## Common Fixes

### Fix 1: Update NEXTAUTH_URL
```env
# Wrong (local)
NEXTAUTH_URL=http://localhost:3000

# Correct (production)
NEXTAUTH_URL=https://yourdomain.com
```

### Fix 2: Database SSL Mode
```env
# Add SSL mode for production databases
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
```

### Fix 3: Middleware Configuration
```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    // Allow API routes to process normally
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // More permissive for API routes
        if (req.nextUrl.pathname.startsWith("/api/")) {
          return true // Let API routes handle their own auth
        }
        return !!token
      },
    },
  }
)
```

### Fix 4: Better Error Handling
```typescript
// Enhanced error handling in API routes
try {
  // Your API logic
} catch (error) {
  console.error("API Error:", error)
  return NextResponse.json(
    { 
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    },
    { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  )
}
```

## Getting Help

If you're still experiencing issues:

1. Check the [deployment platform documentation]
2. Review the error logs carefully
3. Test API endpoints individually
4. Verify all environment variables
5. Compare working local setup with production

## Monitoring

Consider adding:
- Error tracking (Sentry)
- Performance monitoring
- API endpoint monitoring
- Database connection monitoring
