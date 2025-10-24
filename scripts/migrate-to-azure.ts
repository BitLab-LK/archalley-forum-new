#!/usr/bin/env tsx

/**
 * Migration script to transfer data from Supabase to Azure PostgreSQL
 * 
 * This script helps migrate your database from Supabase to Azure Database for PostgreSQL.
 * 
 * Prerequisites:
 * 1. Set up your Azure PostgreSQL database
 * 2. Update your .env file with Azure connection details
 * 3. Ensure both databases are accessible
 * 
 * Usage:
 * 1. Set SUPABASE_DATABASE_URL in your .env for the source database
 * 2. Set DATABASE_URL in your .env for the target Azure database
 * 3. Run: tsx scripts/migrate-to-azure.ts
 */

import { PrismaClient as SupabasePrismaClient } from '@prisma/client'
import { PrismaClient as AzurePrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Create separate Prisma clients for source and target databases
const supabaseClient = new SupabasePrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL
    }
  }
})

const azureClient = new AzurePrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

interface MigrationStats {
  users: number
  posts: number
  comments: number
  categories: number
  notifications: number
  badges: number
  userBadges: number
  votes: number
  workExperience: number
  education: number
  pages: number
  settings: number
  emailLogs: number
  advertisements: number
  postFlags: number
  moderationActions: number
}

const stats: MigrationStats = {
  users: 0,
  posts: 0,
  comments: 0,
  categories: 0,
  notifications: 0,
  badges: 0,
  userBadges: 0,
  votes: 0,
  workExperience: 0,
  education: 0,
  pages: 0,
  settings: 0,
  emailLogs: 0,
  advertisements: 0,
  postFlags: 0,
  moderationActions: 0
}

async function testConnections() {
  console.log('🔍 Testing database connections...')
  
  try {
    await supabaseClient.$connect()
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    process.exit(1)
  }

  try {
    await azureClient.$connect()
    console.log('✅ Azure PostgreSQL connection successful')
  } catch (error) {
    console.error('❌ Azure PostgreSQL connection failed:', error)
    process.exit(1)
  }
}

async function migrateTable<T>(
  tableName: string,
  fetchData: () => Promise<T[]>,
  insertData: (data: T[]) => Promise<any>
) {
  try {
    console.log(`📦 Migrating ${tableName}...`)
    
    const data = await fetchData()
    if (data.length === 0) {
      console.log(`   ⚠️  No ${tableName} data to migrate`)
      return
    }

    // Insert data in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      await insertData(batch)
    }

    stats[tableName as keyof MigrationStats] = data.length
    console.log(`   ✅ Migrated ${data.length} ${tableName} records`)
  } catch (error) {
    console.error(`   ❌ Error migrating ${tableName}:`, error)
    throw error
  }
}

async function migrateUsers() {
  await migrateTable(
    'users',
    () => supabaseClient.users.findMany(),
    (data) => azureClient.users.createMany({ data, skipDuplicates: true })
  )
}

async function migrateCategories() {
  await migrateTable(
    'categories',
    () => supabaseClient.categories.findMany(),
    (data) => azureClient.categories.createMany({ data, skipDuplicates: true })
  )
}

async function migratePosts() {
  try {
    console.log(`📦 Migrating posts...`)
    
    const data = await supabaseClient.post.findMany()
    if (data.length === 0) {
      console.log(`   ⚠️  No posts data to migrate`)
      return
    }

    // Transform data to handle aiSuggestions type conversion
    const transformedData = data.map(post => ({
      ...post,
      aiSuggestions: post.aiSuggestions as any
    }))

    // Insert data in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      await azureClient.post.createMany({ data: batch, skipDuplicates: true })
    }

    stats.posts = transformedData.length
    console.log(`   ✅ Migrated ${transformedData.length} posts records`)
  } catch (error) {
    console.error(`   ❌ Error migrating posts:`, error)
    throw error
  }
}

async function migrateComments() {
  await migrateTable(
    'comments',
    () => supabaseClient.comment.findMany(),
    (data) => azureClient.comment.createMany({ data, skipDuplicates: true })
  )
}

async function migrateNotifications() {
  try {
    console.log(`📦 Migrating notifications...`)
    
    const data = await supabaseClient.notifications.findMany()
    if (data.length === 0) {
      console.log(`   ⚠️  No notifications data to migrate`)
      return
    }

    // Transform data to handle data field type conversion
    const transformedData = data.map(notification => ({
      ...notification,
      data: notification.data as any
    }))

    // Insert data in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      await azureClient.notifications.createMany({ data: batch, skipDuplicates: true })
    }

    stats.notifications = transformedData.length
    console.log(`   ✅ Migrated ${transformedData.length} notifications records`)
  } catch (error) {
    console.error(`   ❌ Error migrating notifications:`, error)
    throw error
  }
}

async function migrateBadges() {
  try {
    console.log(`📦 Migrating badges...`)
    
    const data = await supabaseClient.badges.findMany()
    if (data.length === 0) {
      console.log(`   ⚠️  No badges data to migrate`)
      return
    }

    // Transform data to handle criteria field type conversion
    const transformedData = data.map(badge => ({
      ...badge,
      criteria: badge.criteria as any
    }))

    // Insert data in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      await azureClient.badges.createMany({ data: batch, skipDuplicates: true })
    }

    stats.badges = transformedData.length
    console.log(`   ✅ Migrated ${transformedData.length} badges records`)
  } catch (error) {
    console.error(`   ❌ Error migrating badges:`, error)
    throw error
  }
}

async function migrateUserBadges() {
  await migrateTable(
    'userBadges',
    () => supabaseClient.userBadges.findMany(),
    (data) => azureClient.userBadges.createMany({ data, skipDuplicates: true })
  )
}

async function migrateVotes() {
  await migrateTable(
    'votes',
    () => supabaseClient.votes.findMany(),
    (data) => azureClient.votes.createMany({ data, skipDuplicates: true })
  )
}

async function migrateWorkExperience() {
  await migrateTable(
    'workExperience',
    () => supabaseClient.workExperience.findMany(),
    (data) => azureClient.workExperience.createMany({ data, skipDuplicates: true })
  )
}

async function migrateEducation() {
  await migrateTable(
    'education',
    () => supabaseClient.education.findMany(),
    (data) => azureClient.education.createMany({ data, skipDuplicates: true })
  )
}

async function migratePages() {
  await migrateTable(
    'pages',
    () => supabaseClient.pages.findMany(),
    (data) => azureClient.pages.createMany({ data, skipDuplicates: true })
  )
}

async function migrateSettings() {
  await migrateTable(
    'settings',
    () => supabaseClient.settings.findMany(),
    (data) => azureClient.settings.createMany({ data, skipDuplicates: true })
  )
}

async function migrateEmailLogs() {
  try {
    console.log(`📦 Migrating emailLogs...`)
    
    const data = await supabaseClient.emailLogs.findMany()
    if (data.length === 0) {
      console.log(`   ⚠️  No emailLogs data to migrate`)
      return
    }

    // Transform data to handle metadata field type conversion
    const transformedData = data.map(log => ({
      ...log,
      metadata: log.metadata as any
    }))

    // Insert data in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      await azureClient.emailLogs.createMany({ data: batch, skipDuplicates: true })
    }

    stats.emailLogs = transformedData.length
    console.log(`   ✅ Migrated ${transformedData.length} emailLogs records`)
  } catch (error) {
    console.error(`   ❌ Error migrating emailLogs:`, error)
    throw error
  }
}

async function migrateAdvertisements() {
  await migrateTable(
    'advertisements',
    () => supabaseClient.advertisement.findMany(),
    (data) => azureClient.advertisement.createMany({ data, skipDuplicates: true })
  )
}

async function migratePostFlags() {
  await migrateTable(
    'postFlags',
    () => supabaseClient.postFlag.findMany(),
    (data) => azureClient.postFlag.createMany({ data, skipDuplicates: true })
  )
}

async function migrateModerationActions() {
  try {
    console.log(`📦 Migrating moderationActions...`)
    
    const data = await supabaseClient.moderationAction.findMany()
    if (data.length === 0) {
      console.log(`   ⚠️  No moderationActions data to migrate`)
      return
    }

    // Transform data to handle JSON field type conversion
    const transformedData = data.map(action => ({
      ...action,
      metadata: action.metadata as any,
      previousState: action.previousState as any
    }))

    // Insert data in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      await azureClient.moderationAction.createMany({ data: batch, skipDuplicates: true })
    }

    stats.moderationActions = transformedData.length
    console.log(`   ✅ Migrated ${transformedData.length} moderationActions records`)
  } catch (error) {
    console.error(`   ❌ Error migrating moderationActions:`, error)
    throw error
  }
}

async function migratePostCategories() {
  await migrateTable(
    'postCategories',
    () => supabaseClient.postCategory.findMany(),
    (data) => azureClient.postCategory.createMany({ data, skipDuplicates: true })
  )
}

async function migrateAccounts() {
  await migrateTable(
    'accounts',
    () => supabaseClient.account.findMany(),
    (data) => azureClient.account.createMany({ data, skipDuplicates: true })
  )
}

async function main() {
  console.log('🚀 Starting database migration from Supabase to Azure PostgreSQL...')
  console.log('=' .repeat(60))

  try {
    // Test connections first
    await testConnections()

    // Migrate in dependency order
    console.log('\n📋 Starting data migration...')
    
    await migrateUsers()
    await migrateCategories()
    await migrateBadges()
    await migrateAccounts()
    
    await migratePosts()
    await migratePostCategories()
    await migrateComments()
    await migrateVotes()
    
    await migrateNotifications()
    await migrateUserBadges()
    await migrateWorkExperience()
    await migrateEducation()
    await migratePages()
    await migrateSettings()
    await migrateEmailLogs()
    await migrateAdvertisements()
    await migratePostFlags()
    await migrateModerationActions()

    console.log('\n' + '=' .repeat(60))
    console.log('🎉 Migration completed successfully!')
    console.log('\n📊 Migration Statistics:')
    console.log(`   Users: ${stats.users}`)
    console.log(`   Posts: ${stats.posts}`)
    console.log(`   Comments: ${stats.comments}`)
    console.log(`   Categories: ${stats.categories}`)
    console.log(`   Notifications: ${stats.notifications}`)
    console.log(`   Badges: ${stats.badges}`)
    console.log(`   User Badges: ${stats.userBadges}`)
    console.log(`   Votes: ${stats.votes}`)
    console.log(`   Work Experience: ${stats.workExperience}`)
    console.log(`   Education: ${stats.education}`)
    console.log(`   Pages: ${stats.pages}`)
    console.log(`   Settings: ${stats.settings}`)
    console.log(`   Email Logs: ${stats.emailLogs}`)
    console.log(`   Advertisements: ${stats.advertisements}`)
    console.log(`   Post Flags: ${stats.postFlags}`)
    console.log(`   Moderation Actions: ${stats.moderationActions}`)

    const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0)
    console.log(`\n   Total Records Migrated: ${totalRecords}`)

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await supabaseClient.$disconnect()
    await azureClient.$disconnect()
  }
}

// Run the migration
if (require.main === module) {
  main().catch(console.error)
}

export { main as migrateToAzure }