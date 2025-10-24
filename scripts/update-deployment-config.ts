#!/usr/bin/env tsx

/**
 * Script to update deployment configuration for Azure PostgreSQL
 * 
 * This script updates various configuration files to ensure compatibility
 * with Azure Database for PostgreSQL.
 * 
 * Usage: tsx scripts/update-deployment-config.ts
 */

import fs from 'fs'

async function updateVercelConfig() {
  const vercelPath = 'vercel.json'
  
  if (!fs.existsSync(vercelPath)) {
    console.log('📝 Creating vercel.json with Azure PostgreSQL configuration...')
    
    const vercelConfig = {
      "env": {
        "DATABASE_URL": "@database_url",
        "PGHOST": "@pg_host",
        "PGUSER": "@pg_user",
        "PGPORT": "@pg_port", 
        "PGDATABASE": "@pg_database",
        "PGPASSWORD": "@pg_password"
      },
      "build": {
        "env": {
          "PRISMA_CLIENT_ENGINE_TYPE": "library"
        }
      }
    }
    
    fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2))
    console.log('   ✅ Created vercel.json')
  } else {
    console.log('📝 Updating existing vercel.json...')
    const existing = JSON.parse(fs.readFileSync(vercelPath, 'utf8'))
    
    // Add environment variables if they don't exist
    if (!existing.env) {
      existing.env = {}
    }
    
    existing.env.DATABASE_URL = "@database_url"
    existing.env.PGHOST = "@pg_host"
    existing.env.PGUSER = "@pg_user"
    existing.env.PGPORT = "@pg_port"
    existing.env.PGDATABASE = "@pg_database"
    existing.env.PGPASSWORD = "@pg_password"
    
    // Add build environment
    if (!existing.build) {
      existing.build = {}
    }
    if (!existing.build.env) {
      existing.build.env = {}
    }
    existing.build.env.PRISMA_CLIENT_ENGINE_TYPE = "library"
    
    fs.writeFileSync(vercelPath, JSON.stringify(existing, null, 2))
    console.log('   ✅ Updated vercel.json')
  }
}

async function updatePackageJson() {
  const packagePath = 'package.json'
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  console.log('📝 Updating package.json with Azure-specific scripts...')
  
  // Add new scripts
  const newScripts = {
    "db:migrate:azure": "prisma migrate deploy --schema=./prisma/schema.prisma",
    "db:test:azure": "tsx scripts/test-azure-connection.ts", 
    "db:migrate:data": "tsx scripts/migrate-to-azure.ts",
    "db:setup:azure": "tsx scripts/test-azure-connection.ts && prisma migrate deploy"
  }
  
  packageJson.scripts = { ...packageJson.scripts, ...newScripts }
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
  console.log('   ✅ Updated package.json scripts')
}

async function createAzureEnvTemplate() {
  const envTemplate = `# Azure PostgreSQL Configuration
# Copy this to your .env file and update with your actual values

# Azure Database for PostgreSQL Flexible Server
DATABASE_URL="postgresql://postgres:{password}@ai-builder-db-server.postgres.database.azure.com:5432/archalley?sslmode=require"
PRISMA_CLIENT_ENGINE_TYPE=library

# Azure PostgreSQL Connection Details (for direct connection)
PGHOST=ai-builder-db-server.postgres.database.azure.com
PGUSER=postgres
PGPORT=5432
PGDATABASE=archalley
PGPASSWORD={password}

# Legacy Supabase configuration (remove after migration)
# SUPABASE_DATABASE_URL="postgresql://postgres:{supabase_password}@{supabase_host}:5432/postgres?sslmode=require"
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Other environment variables (keep your existing values)
# ... (your other environment variables)
`

  fs.writeFileSync('env.azure.example', envTemplate)
  console.log('📝 Created env.azure.example template')
}

async function createMigrationGuide() {
  const migrationGuide = `# Azure PostgreSQL Migration Guide

## Overview
This guide helps you migrate your database from Supabase to Azure Database for PostgreSQL Flexible Server.

## Prerequisites
1. Azure Database for PostgreSQL Flexible Server created
2. Database user and password configured
3. Network access rules configured (allow your IP/Vercel IPs)
4. SSL connection enabled

## Migration Steps

### 1. Update Environment Variables
Copy \`env.azure.example\` to \`.env\` and update with your Azure credentials:

\`\`\`bash
cp env.azure.example .env
# Edit .env with your actual Azure credentials
\`\`\`

### 2. Test Azure Connection
\`\`\`bash
npm run db:test:azure
\`\`\`

### 3. Deploy Schema to Azure
\`\`\`bash
npm run db:migrate:azure
\`\`\`

### 4. Migrate Data (if needed)
If you have existing data in Supabase:

1. Set \`SUPABASE_DATABASE_URL\` in your .env
2. Run the migration script:
\`\`\`bash
npm run db:migrate:data
\`\`\`

### 5. Update Vercel Deployment
1. Add environment variables in Vercel dashboard:
   - \`DATABASE_URL\`
   - \`PGHOST\`
   - \`PGUSER\`
   - \`PGPORT\`
   - \`PGDATABASE\`
   - \`PGPASSWORD\`

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
`

  fs.writeFileSync('AZURE_MIGRATION_GUIDE.md', migrationGuide)
  console.log('📝 Created AZURE_MIGRATION_GUIDE.md')
}

async function main() {
  console.log('🚀 Updating deployment configuration for Azure PostgreSQL...')
  console.log('=' .repeat(60))

  try {
    await updateVercelConfig()
    await updatePackageJson()
    await createAzureEnvTemplate()
    await createMigrationGuide()

    console.log('\n' + '=' .repeat(60))
    console.log('🎉 Deployment configuration updated successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your .env file with Azure credentials')
    console.log('2. Test connection: npm run db:test:azure')
    console.log('3. Deploy schema: npm run db:migrate:azure')
    console.log('4. Migrate data: npm run db:migrate:data (if needed)')
    console.log('5. Update Vercel environment variables')
    console.log('6. Deploy your application')

  } catch (error) {
    console.error('❌ Configuration update failed:', error)
    process.exit(1)
  }
}

// Run the configuration update
if (require.main === module) {
  main().catch(console.error)
}

export { main as updateDeploymentConfig }