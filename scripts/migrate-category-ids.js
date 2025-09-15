/**
 * Migration script to populate categoryIds for existing posts
 * This ensures multiple categories functionality works for all posts
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCategoryIds() {
  console.log('🔄 Starting categoryIds migration...');
  
  try {
    // Get all posts that don't have categoryIds populated
    const postsWithoutCategoryIds = await prisma.post.findMany({
      where: {
        OR: [
          { categoryIds: { isEmpty: true } },
          { categoryIds: null }
        ]
      },
      select: {
        id: true,
        categoryId: true,
        categoryIds: true,
        aiCategories: true
      }
    });

    console.log(`📊 Found ${postsWithoutCategoryIds.length} posts without categoryIds`);

    if (postsWithoutCategoryIds.length === 0) {
      console.log('✅ All posts already have categoryIds populated');
      return;
    }

    // Get all available categories
    const allCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    });

    const categoryNameToIdMap = new Map(
      allCategories.map(cat => [cat.name.toLowerCase(), cat.id])
    );

    console.log(`📋 Available categories: ${allCategories.map(c => c.name).join(', ')}`);

    // Update each post
    let updated = 0;
    for (const post of postsWithoutCategoryIds) {
      const categoryIds = [post.categoryId]; // Start with primary category
      
      // Add AI-suggested categories if they exist and match our database
      if (post.aiCategories && post.aiCategories.length > 0) {
        for (const aiCategoryName of post.aiCategories) {
          const categoryId = categoryNameToIdMap.get(aiCategoryName.toLowerCase());
          if (categoryId && !categoryIds.includes(categoryId)) {
            categoryIds.push(categoryId);
          }
        }
      }

      // Update the post with the categoryIds array
      await prisma.post.update({
        where: { id: post.id },
        data: { categoryIds: categoryIds }
      });

      console.log(`✅ Updated post ${post.id} with categories: ${categoryIds.length}`);
      updated++;
    }

    console.log(`🎉 Migration completed! Updated ${updated} posts`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const postsWithMultipleCategories = await prisma.post.findMany({
    where: {
      categoryIds: {
        // Posts with more than one category
        not: { isEmpty: true }
      }
    },
    select: {
      id: true,
      categoryIds: true,
      aiCategories: true
    },
    take: 5
  });

  console.log(`📊 Posts with multiple categories: ${postsWithMultipleCategories.length}`);
  
  if (postsWithMultipleCategories.length > 0) {
    console.log('Sample posts with multiple categories:');
    postsWithMultipleCategories.forEach(post => {
      console.log(`- Post ${post.id}: ${post.categoryIds.length} categories, AI: ${post.aiCategories?.length || 0}`);
    });
  }

  const totalPosts = await prisma.post.count();
  const postsWithCategoryIds = await prisma.post.count({
    where: {
      categoryIds: {
        not: { isEmpty: true }
      }
    }
  });

  console.log(`📈 Total posts: ${totalPosts}`);
  console.log(`📈 Posts with categoryIds: ${postsWithCategoryIds}`);
  console.log(`✅ Migration verification complete!`);
}

async function main() {
  try {
    await migrateCategoryIds();
    await verifyMigration();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateCategoryIds, verifyMigration };