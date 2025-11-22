/**
 * Migration Script: Vercel Blob Storage to Azure Blob Storage
 * 
 * This script migrates all existing files from Vercel Blob Storage to Azure Blob Storage
 * and updates all database references with the new URLs.
 * 
 * Usage: tsx scripts/migrate-vercel-to-azure-blob.ts
 */

import { PrismaClient } from '@prisma/client';
import { uploadToAzureBlob } from '../lib/azure-blob-storage';
// Note: This script requires @vercel/blob to be temporarily installed for migration
// After migration is complete, this dependency can be removed
// import { list, head } from '@vercel/blob';

const prisma = new PrismaClient();

// Vercel Blob URL pattern: https://*.public.blob.vercel-storage.com/*
const VERCEL_BLOB_PATTERN = /https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/(.+)/;

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Check if a URL is a Vercel Blob URL
 */
function isVercelBlobUrl(url: string): boolean {
  return VERCEL_BLOB_PATTERN.test(url);
}

/**
 * Extract blob path from Vercel Blob URL
 */
function extractBlobPath(url: string): string | null {
  const match = url.match(VERCEL_BLOB_PATTERN);
  return match ? match[1] : null;
}

/**
 * Download file from Vercel Blob Storage
 */
async function downloadFromVercel(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Failed to download from Vercel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Migrate a single file from Vercel to Azure
 */
async function migrateFile(vercelUrl: string, stats: MigrationStats): Promise<string | null> {
  try {
    // Extract blob path from Vercel URL
    const blobPath = extractBlobPath(vercelUrl);
    if (!blobPath) {
      console.warn(`⚠️  Could not extract blob path from URL: ${vercelUrl}`);
      stats.skipped++;
      return null;
    }

    // Download file from Vercel
    console.log(`📥 Downloading: ${blobPath}`);
    const fileBuffer = await downloadFromVercel(vercelUrl);

    // Get content type from Vercel blob metadata if possible
    let contentType = 'application/octet-stream';
    try {
      // Note: Requires @vercel/blob package - install temporarily for migration
      // const { head } = await import('@vercel/blob');
      // const blobInfo = await head(vercelUrl);
      // if (blobInfo.contentType) {
      //   contentType = blobInfo.contentType;
      // }
    } catch (error) {
      // If we can't get metadata, try to infer from file extension
      const ext = blobPath.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
      if (ext && mimeTypes[ext]) {
        contentType = mimeTypes[ext];
      }
    }

    // Upload to Azure Blob Storage
    console.log(`📤 Uploading to Azure: ${blobPath}`);
    const result = await uploadToAzureBlob(fileBuffer, blobPath, {
      containerName: 'uploads',
      contentType,
      addRandomSuffix: false, // Keep original path
    });

    console.log(`✅ Migrated: ${vercelUrl} -> ${result.url}`);
    stats.migrated++;
    return result.url;
  } catch (error) {
    const errorMsg = `Failed to migrate ${vercelUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
    stats.failed++;
    return null;
  }
}

/**
 * Migrate Post images
 */
async function migratePostImages(stats: MigrationStats): Promise<void> {
  console.log('\n📝 Migrating Post images...');
  
  const posts = await prisma.post.findMany({
    select: { id: true, images: true },
  });

  for (const post of posts) {
    if (!post.images || post.images.length === 0) continue;

    const newImages: string[] = [];
    let updated = false;

    for (const imageUrl of post.images) {
      if (isVercelBlobUrl(imageUrl)) {
        stats.total++;
        const newUrl = await migrateFile(imageUrl, stats);
        if (newUrl) {
          newImages.push(newUrl);
          updated = true;
        } else {
          // Keep original URL if migration failed
          newImages.push(imageUrl);
        }
      } else {
        // Not a Vercel URL, keep as-is
        newImages.push(imageUrl);
      }
    }

    if (updated) {
      await prisma.post.update({
        where: { id: post.id },
        data: { images: newImages },
      });
      console.log(`✅ Updated post ${post.id}`);
    }
  }
}

/**
 * Migrate user profile images
 */
async function migrateUserImages(stats: MigrationStats): Promise<void> {
  console.log('\n👤 Migrating user profile images...');
  
  const users = await prisma.users.findMany({
    where: {
      image: { not: null },
    },
    select: { id: true, image: true },
  });

  for (const user of users) {
    if (!user.image || !isVercelBlobUrl(user.image)) continue;

    stats.total++;
    const newUrl = await migrateFile(user.image, stats);
    
    if (newUrl) {
      await prisma.users.update({
        where: { id: user.id },
        data: { image: newUrl },
      });
      console.log(`✅ Updated user ${user.id}`);
    }
  }
}

/**
 * Migrate competition registration files
 */
async function migrateCompetitionRegistrations(stats: MigrationStats): Promise<void> {
  console.log('\n🏆 Migrating competition registration files...');
  
  const registrations = await prisma.competitionRegistration.findMany({
    select: {
      id: true,
      members: true,
      submissionFiles: true,
      submissionUrl: true,
    },
  });

  for (const registration of registrations) {
    let updated = false;
    const updates: any = {};

    // Migrate submission files
    if (registration.submissionFiles) {
      const submissionFiles = registration.submissionFiles as any;
      if (Array.isArray(submissionFiles)) {
        const newFiles = [];
        for (const file of submissionFiles) {
          if (typeof file === 'string' && isVercelBlobUrl(file)) {
            stats.total++;
            const newUrl = await migrateFile(file, stats);
            newFiles.push(newUrl || file);
            if (newUrl) updated = true;
          } else if (file?.url && isVercelBlobUrl(file.url)) {
            stats.total++;
            const newUrl = await migrateFile(file.url, stats);
            if (newUrl) {
              newFiles.push({ ...file, url: newUrl });
              updated = true;
            } else {
              newFiles.push(file);
            }
          } else {
            newFiles.push(file);
          }
        }
        updates.submissionFiles = newFiles;
      }
    }

    // Migrate submission URL
    if (registration.submissionUrl && isVercelBlobUrl(registration.submissionUrl)) {
      stats.total++;
      const newUrl = await migrateFile(registration.submissionUrl, stats);
      if (newUrl) {
        updates.submissionUrl = newUrl;
        updated = true;
      }
    }

    // Migrate member ID card URLs
    if (registration.members) {
      const members = registration.members as any;
      if (Array.isArray(members)) {
        const newMembers = [];
        for (const member of members) {
          if (member?.idCardUrl && isVercelBlobUrl(member.idCardUrl)) {
            stats.total++;
            const newUrl = await migrateFile(member.idCardUrl, stats);
            if (newUrl) {
              newMembers.push({ ...member, idCardUrl: newUrl });
              updated = true;
            } else {
              newMembers.push(member);
            }
          } else {
            newMembers.push(member);
          }
        }
        updates.members = newMembers;
      }
    }

    if (updated) {
      await prisma.competitionRegistration.update({
        where: { id: registration.id },
        data: updates,
      });
      console.log(`✅ Updated registration ${registration.id}`);
    }
  }
}

/**
 * Migrate advertisement images
 */
async function migrateAdvertisementImages(stats: MigrationStats): Promise<void> {
  console.log('\n📢 Migrating advertisement images...');
  
  const ads = await prisma.advertisement.findMany({
    select: { id: true, imageUrl: true },
  });

  for (const ad of ads) {
    if (!ad.imageUrl || !isVercelBlobUrl(ad.imageUrl)) continue;

    stats.total++;
    const newUrl = await migrateFile(ad.imageUrl, stats);
    
    if (newUrl) {
      await prisma.advertisement.update({
        where: { id: ad.id },
        data: { imageUrl: newUrl },
      });
      console.log(`✅ Updated advertisement ${ad.id}`);
    }
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting migration from Vercel Blob Storage to Azure Blob Storage...\n');

  // Check if Vercel Blob token is available
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN not found. Cannot download files from Vercel Blob Storage.');
    process.exit(1);
  }

  // Check if Azure Storage is configured
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING && 
      (!process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY)) {
    console.error('❌ Azure Storage configuration not found. Please set AZURE_STORAGE_CONNECTION_STRING or both AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY.');
    process.exit(1);
  }

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Migrate all file types
    await migratePostImages(stats);
    await migrateUserImages(stats);
    await migrateCompetitionRegistrations(stats);
    await migrateAdvertisementImages(stats);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total files found: ${stats.total}`);
    console.log(`✅ Successfully migrated: ${stats.migrated}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (stats.migrated === stats.total && stats.total > 0) {
      console.log('\n✅ Migration completed successfully!');
    } else if (stats.migrated > 0) {
      console.log('\n⚠️  Migration completed with some failures. Please review the errors above.');
    } else {
      console.log('\nℹ️  No files found to migrate.');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

