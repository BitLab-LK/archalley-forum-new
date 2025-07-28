const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentPosts() {
  try {
    console.log('🔍 Checking recent posts with attachments...');
    
    const recentPosts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        users: { select: { name: true } }
      }
    });
    
    console.log('Recent posts:');
    for (const post of recentPosts) {
      console.log(`- Post ${post.id}: "${post.content.substring(0, 50)}..."`);
      console.log(`  Author: ${post.users.name}`);
      
      // Get attachments separately
      const attachments = await prisma.attachments.findMany({
        where: { postId: post.id }
      });
      
      console.log(`  Attachments: ${attachments.length}`);
      attachments.forEach((att, i) => {
        console.log(`    ${i + 1}. ${att.filename} - ${att.url}`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentPosts();
