# Database Connection Issues - Troubleshooting Guide

## Problem: "Can't reach database server at `aws-0-ap-southeast-`"

This error indicates intermittent connectivity issues with your AWS RDS database in the Asia Pacific (Southeast) region.

## Root Causes

### 1. **Database Connection Limits**
- AWS RDS has connection limits (varies by instance type)
- Multiple concurrent requests can exhaust the connection pool
- Serverless environments create many short-lived connections

### 2. **Network Timeouts**
- Geographic distance between Vercel (US East) and AWS Southeast Asia
- Network latency causing connection timeouts
- Intermittent network issues

### 3. **Database Configuration**
- Insufficient connection timeout settings
- No connection pooling
- Missing SSL/TLS configuration

## Solutions Implemented

### ✅ **1. Enhanced Connection Retry Logic**
```typescript
// Automatic retry with exponential backoff
- Initial attempt
- Retry after 2 seconds
- Retry after 4 seconds  
- Retry after 8 seconds
- Final failure with detailed error
```

### ✅ **2. Client-Side Retry**
```typescript
// Browser automatically retries failed requests
- 3 automatic retries
- Exponential backoff delays
- User-friendly error messages
- Manual retry options
```

### ✅ **3. Better Error Handling**
```typescript
// Distinguish between different error types
- Database connection errors (503 Service Unavailable)
- Network timeout errors (with retry suggestions)
- Other server errors (500 Internal Server Error)
```

## Database Configuration Recommendations

### **Option 1: Connection Pooling (Recommended)**
Use a connection pooler like PgBouncer:

```env
# Instead of direct connection
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Use connection pooler
DATABASE_URL=postgresql://user:pass@pooler-host:port/dbname?pgbouncer=true
```

### **Option 2: Database Proxy**
Use AWS RDS Proxy for better connection management:

```env
DATABASE_URL=postgresql://user:pass@rds-proxy-endpoint:port/dbname
```

### **Option 3: Regional Optimization**
Consider moving database closer to your primary deployment region:

- **Current**: AWS Southeast Asia → Vercel US East (high latency)
- **Better**: AWS US East → Vercel US East (low latency)

## Environment Variables Check

Ensure these are properly set in your deployment:

```env
# Database connection (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require&connect_timeout=60

# Connection timeout settings
PRISMA_CLI_QUERY_ENGINE_TYPE=binary
DATABASE_CONNECTION_LIMIT=10

# SSL settings for AWS RDS
DATABASE_SSL_MODE=require
```

## Monitoring Commands

### Check database connectivity:
```bash
# Test from deployment environment
curl https://yourdomain.com/api/debug/deployment
```

### Health check:
```bash
# Quick health check
curl https://yourdomain.com/api/health
```

### Database-specific health check:
```bash
# Detailed database status
curl https://yourdomain.com/api/debug/deployment | jq '.database'
```

## Quick Fixes

### **1. Immediate Fix (5 minutes)**
Add connection timeout to DATABASE_URL:
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&connect_timeout=60&pool_timeout=60
```

### **2. Short-term Fix (30 minutes)**
Enable connection pooling in your database provider:
- AWS RDS: Enable RDS Proxy
- PlanetScale: Built-in connection pooling
- Supabase: Enable connection pooling

### **3. Long-term Fix (2 hours)**
Move database to same region as deployment:
1. Create new database in US East
2. Export data from current database  
3. Import to new database
4. Update DATABASE_URL
5. Test thoroughly

## Prevention

### **1. Connection Monitoring**
- Set up alerts for database connection failures
- Monitor connection pool usage
- Track response times by region

### **2. Load Testing**
- Test with multiple concurrent users
- Verify connection handling under load
- Test geographic access patterns

### **3. Backup Plans**
- Implement database read replicas
- Consider multi-region database setup
- Have rollback plan for database migrations

## When to Expect Issues

- **Peak traffic times** (more concurrent connections)
- **Cold starts** (serverless functions initializing)
- **Geographic distance** (users far from database)
- **Network instability** (temporary AWS network issues)

## Support Contacts

- **AWS RDS Support**: Check AWS Service Health Dashboard
- **Vercel Support**: Check Vercel Status Page
- **Database Provider**: Contact your database provider's support

---

## Status Indicators

🟢 **Normal**: Response times < 1 second, no connection errors
🟡 **Degraded**: Response times 1-5 seconds, occasional timeouts  
🔴 **Down**: Connection failures, timeouts > 10 seconds

Monitor these at: `https://yourdomain.com/api/health`
