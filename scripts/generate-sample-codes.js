/**
 * Simple Display Code Generation Examples
 * This demonstrates the anonymous display codes generated for participants
 */

const crypto = require('crypto');

function generateDisplayCode(year) {
  const currentYear = year || new Date().getFullYear();
  const prefix = `ARC${currentYear}`;
  
  // Generate 6 random alphanumeric characters (excluding similar-looking chars: 0, O, I, l, 1)
  const chars = '2345679ABCDEFGHJKLMNPQRSTUVWXYZ'; // 30 characters
  const randomBytes = crypto.randomBytes(6);
  
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += chars[randomBytes[i] % chars.length];
  }
  
  return `${prefix}-${randomCode}`;
}

console.log('🔒 Anonymous Display Code Examples\n');
console.log('=' .repeat(60));
console.log('\n📋 Generated Display Codes (for public entry display):\n');

for (let i = 1; i <= 10; i++) {
  const code = generateDisplayCode(2025);
  console.log(`   ${i.toString().padStart(2, '0')}. ${code}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ These codes will be used instead of real names when');
console.log('   displaying competition entries publicly on the website.');
console.log('\n🔒 Privacy Protected: Real identities remain confidential.\n');
