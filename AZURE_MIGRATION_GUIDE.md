# Azure PostgreSQL Migration Guide

## Overview
This guide helps you migrate your database from Supabase to Azure Database for PostgreSQL Flexible Server.

## Prerequisites
1. Azure Database for PostgreSQL Flexible Server created
2. Database user and password configured
3. Network access rules configured (allow your IP/Vercel IPs)
4. SSL connection enabled

## Migration Steps

### 1. Update Environment Variables
Copy `env.azure.example` to `.env` and update with your Azure credentials:

```bash
cp env.azure.example .env
# Edit .env with your actual Azure credentials
```

### 2. Test Azure Connection
```bash
npm run db:test:azure
```

### 3. Deploy Schema to Azure
```bash
npm run db:migrate:azure
```

### 4. Migrate Data (if needed)
If you have existing data in Supabase:

1. Set `SUPABASE_DATABASE_URL` in your .env
2. Run the migration script:
```bash
npm run db:migrate:data
```

### 5. Update Vercel Deployment
1. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `PGHOST`
   - `PGUSER`
   - `PGPORT`
   - `PGDATABASE`
   - `PGPASSWORD`

2. Deploy your application

## Verification
After migration, verify:
- [ ] Application connects to Azure PostgreSQL
- [ ] All features work correctly
- [ ] Data integrity maintained
- [ ] Performance is acceptable

## Troubleshooting

### Connection Issues
- Verify Azure firewall rules
- Check SSL requirements
- Confirm credentials

### Migration Issues
- Check data types compatibility
- Verify foreign key constraints
- Review error logs

## Rollback Plan
If issues occur:
1. Revert to Supabase by updating DATABASE_URL
2. Investigate and fix issues
3. Re-run migration when ready

## Support
- Azure PostgreSQL Documentation
- Prisma Documentation
- Vercel Deployment Guide