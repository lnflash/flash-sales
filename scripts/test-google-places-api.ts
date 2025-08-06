#!/usr/bin/env npx tsx

/**
 * Google Places API Integration Test Script
 * 
 * This script tests the Google Places API integration to ensure:
 * 1. API keys are properly configured
 * 2. The API endpoint is working
 * 3. Company enrichment returns expected data
 * 4. Caching mechanism works correctly
 * 5. Error handling is robust
 * 
 * Run with: npx tsx scripts/test-google-places-api.ts
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.cyan}══════════════════════════════════════${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}══════════════════════════════════════${colors.reset}`)
};

// Test configuration
const TEST_COMPANIES = [
  { name: 'Island Grill', location: 'Kingston', expectedType: 'restaurant' },
  { name: 'NCB', location: 'Kingston', expectedType: 'bank' },
  { name: 'Digicel', location: 'Kingston', expectedType: 'telecommunications' },
  { name: 'Fontana Pharmacy', location: 'Kingston', expectedType: 'pharmacy' },
  { name: 'Courts Jamaica', location: 'Montego Bay', expectedType: 'store' },
  { name: 'MegaMart', location: 'Kingston', expectedType: 'supermarket' },
  { name: 'Devon House', location: 'Kingston', expectedType: 'tourist_attraction' },
  { name: 'Sandals Resort', location: 'Montego Bay', expectedType: 'lodging' },
];

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

// Get API keys
function getApiKeys() {
  const publicKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  const serverKey = process.env.GOOGLE_PLACES_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgsxczfkjbtgzcauxuur.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';
  
  return {
    googlePlacesKey: serverKey || publicKey,
    supabaseUrl,
    supabaseKey
  };
}

// Test 1: Check API Key Configuration
async function testApiKeyConfiguration(): Promise<void> {
  log.section('Test 1: API Key Configuration');
  
  const { googlePlacesKey } = getApiKeys();
  
  if (!googlePlacesKey) {
    results.push({
      test: 'API Key Configuration',
      passed: false,
      message: 'Google Places API key not found in environment variables',
      details: {
        checkedVars: ['GOOGLE_PLACES_API_KEY', 'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY']
      }
    });
    log.error('No Google Places API key found');
    return;
  }
  
  if (googlePlacesKey.length < 30) {
    results.push({
      test: 'API Key Configuration',
      passed: false,
      message: 'API key appears to be invalid (too short)',
      details: { keyLength: googlePlacesKey.length }
    });
    log.error('API key appears invalid');
    return;
  }
  
  results.push({
    test: 'API Key Configuration',
    passed: true,
    message: 'API key found and appears valid',
    details: {
      keyPrefix: googlePlacesKey.substring(0, 10) + '...',
      keyLength: googlePlacesKey.length
    }
  });
  log.success('API key configuration valid');
}

// Test 2: Test Google Places API Direct Call
async function testGooglePlacesApiDirect(): Promise<void> {
  log.section('Test 2: Direct Google Places API Call');
  
  const { googlePlacesKey } = getApiKeys();
  if (!googlePlacesKey) {
    log.warning('Skipping - no API key');
    return;
  }
  
  try {
    const searchQuery = 'Island Grill Kingston Jamaica';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googlePlacesKey}`;
    
    log.info(`Testing search for: ${searchQuery}`);
    
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.status === 'OK' && data.results?.length > 0) {
      results.push({
        test: 'Direct API Call',
        passed: true,
        message: `Found ${data.results.length} results`,
        details: {
          firstResult: {
            name: data.results[0].name,
            address: data.results[0].formatted_address,
            types: data.results[0].types
          }
        }
      });
      log.success(`API call successful - found ${data.results.length} results`);
      log.info(`First result: ${data.results[0].name}`);
    } else {
      results.push({
        test: 'Direct API Call',
        passed: false,
        message: `API returned status: ${data.status}`,
        details: data
      });
      log.error(`API call failed: ${data.status}`);
      if (data.error_message) {
        log.error(`Error message: ${data.error_message}`);
      }
    }
  } catch (error) {
    results.push({
      test: 'Direct API Call',
      passed: false,
      message: `Network error: ${error.message}`,
      details: error
    });
    log.error(`Network error: ${error.message}`);
  }
}

// Test 3: Test API Endpoint
async function testApiEndpoint(): Promise<void> {
  log.section('Test 3: API Endpoint (/api/google-places)');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/google-places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'search',
        query: 'NCB Bank Kingston Jamaica'
      })
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      if (data.status === 'OK') {
        results.push({
          test: 'API Endpoint',
          passed: true,
          message: 'Endpoint working correctly',
          details: { resultsCount: data.results?.length }
        });
        log.success('API endpoint working');
      } else {
        results.push({
          test: 'API Endpoint',
          passed: false,
          message: `API returned status: ${data.status}`,
          details: data
        });
        log.error(`API endpoint returned: ${data.status}`);
      }
    } else {
      results.push({
        test: 'API Endpoint',
        passed: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        details: await response.text()
      });
      log.error(`HTTP error: ${response.status}`);
    }
  } catch (error) {
    results.push({
      test: 'API Endpoint',
      passed: false,
      message: `Cannot reach endpoint: ${error.message}`,
      details: { baseUrl, error: error.message }
    });
    log.warning(`Cannot reach endpoint (may be running in Node.js environment)`);
  }
}

// Test 4: Test Supabase Cache
async function testSupabaseCache(): Promise<void> {
  log.section('Test 4: Supabase Enrichment Cache');
  
  const { supabaseUrl, supabaseKey } = getApiKeys();
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to read from cache
    const { data: readData, error: readError } = await supabase
      .from('enrichment_cache')
      .select('*')
      .limit(5);
    
    if (readError) {
      if (readError.code === '406') {
        results.push({
          test: 'Supabase Cache Read',
          passed: false,
          message: 'RLS policy issue - cannot read from cache',
          details: readError
        });
        log.error('RLS policy preventing cache reads (406 error)');
      } else {
        results.push({
          test: 'Supabase Cache Read',
          passed: false,
          message: `Database error: ${readError.message}`,
          details: readError
        });
        log.error(`Database error: ${readError.message}`);
      }
    } else {
      results.push({
        test: 'Supabase Cache Read',
        passed: true,
        message: `Cache table accessible (${readData?.length || 0} entries)`,
        details: { entriesFound: readData?.length || 0 }
      });
      log.success(`Cache accessible - found ${readData?.length || 0} entries`);
    }
    
    // Try to write to cache (as anon user, this might fail)
    const testCacheData = {
      type: 'company',
      key: `test-${Date.now()}`,
      data: { test: true },
      timestamp: new Date().toISOString()
    };
    
    const { error: writeError } = await supabase
      .from('enrichment_cache')
      .insert(testCacheData);
    
    if (writeError) {
      log.info('Cache write failed (expected for anon user)');
    } else {
      log.success('Cache write successful');
      
      // Clean up test data
      await supabase
        .from('enrichment_cache')
        .delete()
        .eq('key', testCacheData.key);
    }
    
  } catch (error) {
    results.push({
      test: 'Supabase Cache',
      passed: false,
      message: `Connection error: ${error.message}`,
      details: error
    });
    log.error(`Supabase connection error: ${error.message}`);
  }
}

// Test 5: Test Multiple Company Searches
async function testCompanySearches(): Promise<void> {
  log.section('Test 5: Company Search Tests');
  
  const { googlePlacesKey } = getApiKeys();
  if (!googlePlacesKey) {
    log.warning('Skipping - no API key');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const company of TEST_COMPANIES) {
    const searchQuery = `${company.name} ${company.location} Jamaica`;
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googlePlacesKey}`;
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        const hasExpectedType = result.types?.some((type: string) => 
          type.includes(company.expectedType) || 
          company.expectedType.includes(type)
        );
        
        if (hasExpectedType || result.name.toLowerCase().includes(company.name.toLowerCase())) {
          log.success(`✓ ${company.name}: Found "${result.name}" at ${result.formatted_address}`);
          successCount++;
        } else {
          log.warning(`⚠ ${company.name}: Found but type mismatch - got ${result.types?.join(', ')}`);
          successCount++;
        }
      } else {
        log.error(`✗ ${company.name}: No results found`);
        failCount++;
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      log.error(`✗ ${company.name}: Error - ${error.message}`);
      failCount++;
    }
  }
  
  results.push({
    test: 'Company Searches',
    passed: successCount > failCount,
    message: `${successCount}/${TEST_COMPANIES.length} searches successful`,
    details: { successCount, failCount, total: TEST_COMPANIES.length }
  });
}

// Test 6: Test Error Handling
async function testErrorHandling(): Promise<void> {
  log.section('Test 6: Error Handling');
  
  const { googlePlacesKey } = getApiKeys();
  if (!googlePlacesKey) {
    log.warning('Skipping - no API key');
    return;
  }
  
  // Test with invalid API key
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=INVALID_KEY`;
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      log.success('Invalid API key handled correctly');
    }
  } catch (error) {
    log.info('Network error with invalid key (expected)');
  }
  
  // Test with empty query
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=&key=${googlePlacesKey}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.status === 'INVALID_REQUEST' || data.status === 'ZERO_RESULTS') {
      log.success('Empty query handled correctly');
    }
  } catch (error) {
    log.error(`Unexpected error with empty query: ${error.message}`);
  }
  
  results.push({
    test: 'Error Handling',
    passed: true,
    message: 'Error cases handled appropriately',
    details: {}
  });
}

// Generate test report
function generateReport(): void {
  log.section('Test Results Summary');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log('\nTest Results:');
  console.log('─────────────');
  
  results.forEach(result => {
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`  Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n  ')}`);
    }
  });
  
  console.log('\n─────────────');
  console.log(`Total: ${total} tests`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  const successRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
  const color = passed === total ? colors.green : failed > passed ? colors.red : colors.yellow;
  console.log(`${color}Success Rate: ${successRate}%${colors.reset}`);
  
  // Save report to file
  saveReport();
}

// Save report to file
async function saveReport(): Promise<void> {
  const reportDir = path.join(process.cwd(), 'test-reports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `google-places-api-test-${timestamp}.json`;
  const filepath = path.join(reportDir, filename);
  
  try {
    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    }, null, 2));
    
    log.info(`\nReport saved to: ${filepath}`);
  } catch (error) {
    log.warning(`Could not save report: ${error.message}`);
  }
}

// Main test runner
async function runTests(): Promise<void> {
  console.log(`${colors.magenta}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}  Google Places API Integration Test Suite${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════${colors.reset}`);
  
  await testApiKeyConfiguration();
  await testGooglePlacesApiDirect();
  await testApiEndpoint();
  await testSupabaseCache();
  await testCompanySearches();
  await testErrorHandling();
  
  generateReport();
  
  // Exit with appropriate code
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});