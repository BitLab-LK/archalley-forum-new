/**
 * Check database for non-English posts and their categorization
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNonEnglishPosts() {
  console.log('🔍 Checking Non-English Posts in Database');
  console.log('=' .repeat(50));

  try {
    // Get posts that have non-English original language or AI categories
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { originalLanguage: { not: 'English' } },
          { originalLanguage: { not: null } },
          { aiCategories: { not: null } },
          { categoryIds: { not: null } }
        ]
      },
      include: {
        categories: true,
        users: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 Found ${posts.length} posts with language/AI data:`);

    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. Post ID: ${post.id.substring(0, 8)}...`);
      console.log(`   👤 Author: ${post.users.name || 'Anonymous'}`);
      console.log(`   📝 Content: "${post.content.substring(0, 60)}..."`);
      console.log(`   🗣️  Original Language: ${post.originalLanguage || 'Not set'}`);
      console.log(`   📂 Primary Category: ${post.categories.name}`);
      console.log(`   🤖 AI Categories: ${post.aiCategories ? JSON.stringify(post.aiCategories) : 'None'}`);
      console.log(`   📋 Category IDs: ${post.categoryIds ? JSON.stringify(post.categoryIds) : 'None'}`);
      console.log(`   🕒 Created: ${post.createdAt.toLocaleString()}`);
    });

    // Check how many are categorized as "Informative"
    const informativePosts = posts.filter(p => p.categories.name === 'Informative');
    const nonEnglishPosts = posts.filter(p => p.originalLanguage && p.originalLanguage !== 'English');
    
    console.log(`\n📈 Statistics:`);
    console.log(`   📊 Total posts analyzed: ${posts.length}`);
    console.log(`   🌍 Non-English posts: ${nonEnglishPosts.length}`);
    console.log(`   ℹ️  Posts categorized as 'Informative': ${informativePosts.length}`);
    console.log(`   ⚠️  Non-English posts marked as 'Informative': ${informativePosts.filter(p => p.originalLanguage && p.originalLanguage !== 'English').length}`);

    if (informativePosts.length > 0 && nonEnglishPosts.length > 0) {
      const ratio = (informativePosts.filter(p => p.originalLanguage && p.originalLanguage !== 'English').length / nonEnglishPosts.length) * 100;
      console.log(`   📊 Percentage of non-English posts marked as 'Informative': ${ratio.toFixed(1)}%`);
      
      if (ratio > 80) {
        console.log(`   ❌ HIGH ISSUE: Most non-English posts are defaulting to 'Informative'`);
        console.log(`      This suggests translation or AI categorization is not working properly.`);
      } else if (ratio > 50) {
        console.log(`   ⚠️  MODERATE ISSUE: Many non-English posts defaulting to 'Informative'`);
      } else {
        console.log(`   ✅ GOOD: Non-English posts are being properly categorized`);
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNonEnglishPosts();