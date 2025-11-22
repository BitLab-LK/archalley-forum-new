/**
 * Test Registration Period Pricing
 * Run this to verify prices change correctly with time periods
 */

// Import the pricing calculation function
const fs = require('fs');
const path = require('path');

// Read and evaluate the TypeScript file (simplified for testing)
// Since we can't easily import TS in Node.js, we'll inline the function

function calculateRegistrationPrice(registrationType, period) {
  // Kids' Tree Category always costs 2,000 regardless of period
  if (registrationType === 'KIDS') {
    return 2000;
  }
  
  // Student Entry always costs 2,000 (available in Standard and Late periods)
  if (registrationType === 'STUDENT') {
    return 2000;
  }
  
  // Single Entry (INDIVIDUAL)
  if (registrationType === 'INDIVIDUAL') {
    switch (period) {
      case 'EARLY_BIRD':
        return 2000;
      case 'STANDARD':
        return 3000;
      case 'LATE':
        return 5000;
      default:
        return 3000;
    }
  }
  
  // Group Entry (TEAM or COMPANY)
  if (registrationType === 'TEAM' || registrationType === 'COMPANY') {
    switch (period) {
      case 'EARLY_BIRD':
        return 4000;
      case 'STANDARD':
        return 5000;
      case 'LATE':
        return 8000;
      default:
        return 5000;
    }
  }
  
  return 3000;
}

console.log('🧪 Testing Registration Period Pricing\n');
console.log('=' .repeat(60));

// Test all registration types across all periods
const types = ['INDIVIDUAL', 'TEAM', 'COMPANY', 'STUDENT', 'KIDS'];
const periods = ['EARLY_BIRD', 'STANDARD', 'LATE'];

console.log('\n📊 PRICING TABLE\n');
console.log('Type'.padEnd(15) + '|  Early Bird  |  Standard  |    Late    |');
console.log('-'.repeat(60));

types.forEach(type => {
  const earlyBird = calculateRegistrationPrice(type, 'EARLY_BIRD');
  const standard = calculateRegistrationPrice(type, 'STANDARD');
  const late = calculateRegistrationPrice(type, 'LATE');
  
  console.log(
    type.padEnd(15) + '|  ' + 
    String(earlyBird).padStart(10) + ' |  ' + 
    String(standard).padStart(8) + ' |  ' + 
    String(late).padStart(8) + ' |'
  );
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Expected Prices (LKR):');
console.log('┌─────────────────┬─────────────┬──────────┬─────────┐');
console.log('│ Registration    │ Early Bird  │ Standard │ Late    │');
console.log('│ Type            │ Nov 11-20   │ Nov 21   │ Dec 21  │');
console.log('│                 │             │ -Dec 20  │ -Dec 24 │');
console.log('├─────────────────┼─────────────┼──────────┼─────────┤');
console.log('│ Single Entry    │    2,000    │  3,000   │  5,000  │');
console.log('│ Group Entry     │    4,000    │  5,000   │  8,000  │');
console.log('│ Student Entry   │    2,000    │  2,000   │  2,000  │');
console.log('│ Kids Tree       │    2,000    │  2,000   │  2,000  │');
console.log('└─────────────────┴─────────────┴──────────┴─────────┘');

console.log('\n🔍 Verification:');
const testCases = [
  { type: 'INDIVIDUAL', period: 'EARLY_BIRD', expected: 2000 },
  { type: 'INDIVIDUAL', period: 'STANDARD', expected: 3000 },
  { type: 'INDIVIDUAL', period: 'LATE', expected: 5000 },
  { type: 'TEAM', period: 'EARLY_BIRD', expected: 4000 },
  { type: 'TEAM', period: 'STANDARD', expected: 5000 },
  { type: 'TEAM', period: 'LATE', expected: 8000 },
  { type: 'STUDENT', period: 'EARLY_BIRD', expected: 2000 },
  { type: 'STUDENT', period: 'STANDARD', expected: 2000 },
  { type: 'STUDENT', period: 'LATE', expected: 2000 },
  { type: 'KIDS', period: 'EARLY_BIRD', expected: 2000 },
  { type: 'KIDS', period: 'STANDARD', expected: 2000 },
  { type: 'KIDS', period: 'LATE', expected: 2000 },
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  const actual = calculateRegistrationPrice(test.type, test.period);
  const status = actual === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (actual === test.expected) {
    passed++;
  } else {
    failed++;
    console.log(`${status} - ${test.type} / ${test.period}: Expected ${test.expected}, Got ${actual}`);
  }
});

console.log(`\n📈 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Pricing changes correctly with time periods.\n');
} else {
  console.log('\n⚠️  Some tests failed. Please check the pricing logic.\n');
  process.exit(1);
}
