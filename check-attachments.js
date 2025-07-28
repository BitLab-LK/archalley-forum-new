const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttachments() {
  try {
    console.log('🔍 Checking all attachments...');
    
    const attachments = await prisma.attachments.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${attachments.length} attachments:`);
    attachments.forEach((att, i) => {
      console.log(`${i + 1}. Post ${att.postId}: ${att.filename}`);
      console.log(`   URL: ${att.url}`);
      console.log(`   Type: ${att.mimeType}, Size: ${att.size}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttachments();
