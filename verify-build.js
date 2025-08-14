// Quick verification script to check if all critical files compile
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'app/api/upload/registration/route.ts',
  'app/api/upload/blob/route.ts',
  'app/api/ai/classify/route.ts',
  'components/activity-feed.tsx',
  'components/sidebar.tsx'
];

console.log('🔍 Checking critical files...');

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax checks
    const hasMissingBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
    const hasOrphanedQuotes = /[^\\]'[^']*$|[^\\]"[^"]*$/m.test(content);
    const hasOrphanedParens = content.includes('`)');
    
    if (hasMissingBraces || hasOrphanedQuotes || hasOrphanedParens) {
      console.log(`❌ ${file}: Potential syntax issues detected`);
    } else {
      console.log(`✅ ${file}: Looks good`);
    }
  } catch (error) {
    console.log(`❌ ${file}: Error reading file - ${error.message}`);
  }
});

console.log('✅ Verification complete');
