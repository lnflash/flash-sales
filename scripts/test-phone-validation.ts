#!/usr/bin/env npx tsx

/**
 * Test script for phone number validation and formatting
 * Run with: npx tsx scripts/test-phone-validation.ts
 */

import { validatePhoneNumber } from '../src/utils/validation';

// Test data with expected results
const testCases = [
  // Valid Jamaican formats
  { input: '876-555-1234', expected: { valid: true, formatted: '(876) 555-1234' } },
  { input: '(876) 555-1234', expected: { valid: true, formatted: '(876) 555-1234' } },
  { input: '8765551234', expected: { valid: true, formatted: '(876) 555-1234' } },
  { input: '876.555.1234', expected: { valid: true, formatted: '(876) 555-1234' } },
  { input: '876 555 1234', expected: { valid: true, formatted: '(876) 555-1234' } },
  { input: '+1 876 555 1234', expected: { valid: true, formatted: '(876) 555-1234' } },
  { input: '1-876-555-1234', expected: { valid: true, formatted: '(876) 555-1234' } },
  
  // Invalid formats
  { input: '555-1234', expected: { valid: false } },
  { input: '123', expected: { valid: false } },
  { input: 'not a phone', expected: { valid: false } },
  { input: '', expected: { valid: false } },
  { input: '876-555-12345', expected: { valid: false } }, // Too many digits
  { input: '876-555-123', expected: { valid: false } }, // Too few digits
];

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

console.log('=====================================');
console.log('Phone Number Validation Test Suite');
console.log('=====================================\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  const result = validatePhoneNumber(testCase.input);
  const testNumber = index + 1;
  
  console.log(`Test ${testNumber}: "${testCase.input}"`);
  
  if (testCase.expected.valid) {
    if (result.isValid && result.formatted === testCase.expected.formatted) {
      console.log(`${colors.green}  ✓ PASS${colors.reset} - Formatted as: ${result.formatted}`);
      passedTests++;
    } else if (result.isValid && result.formatted !== testCase.expected.formatted) {
      console.log(`${colors.yellow}  ⚠ PARTIAL${colors.reset} - Valid but formatted as: ${result.formatted} (expected: ${testCase.expected.formatted})`);
      failedTests++;
    } else {
      console.log(`${colors.red}  ✗ FAIL${colors.reset} - Marked as invalid`);
      if (result.errors) {
        console.log(`    Error: ${result.errors.join(', ')}`);
      }
      failedTests++;
    }
  } else {
    if (!result.isValid) {
      console.log(`${colors.green}  ✓ PASS${colors.reset} - Correctly marked as invalid`);
      passedTests++;
    } else {
      console.log(`${colors.red}  ✗ FAIL${colors.reset} - Should be invalid but was accepted`);
      failedTests++;
    }
  }
  
  console.log('');
});

// Test the PhoneEntry interface structure
console.log('Testing PhoneEntry data structure...');
interface PhoneEntry {
  number: string;
  label: string;
  id: string;
}

const samplePhoneEntries: PhoneEntry[] = [
  { id: '1', number: '(876) 555-0100', label: 'Primary' },
  { id: '2', number: '(876) 555-0101', label: 'Mobile' },
  { id: '3', number: '(876) 555-0102', label: 'WhatsApp' },
  { id: '4', number: '(876) 555-0103', label: 'Office' },
];

console.log('Sample phone entries array:');
samplePhoneEntries.forEach(entry => {
  console.log(`  ${entry.label}: ${entry.number}`);
});

// Summary
console.log('\n=====================================');
console.log('Test Summary');
console.log('=====================================');
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
console.log(`Total: ${testCases.length}`);

if (failedTests === 0) {
  console.log(`\n${colors.green}All tests passed! ✓${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}Some tests failed. Please review the validation logic.${colors.reset}`);
  process.exit(1);
}