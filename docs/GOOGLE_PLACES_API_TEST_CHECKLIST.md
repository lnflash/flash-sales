# Google Places API Testing Checklist

## Environment Setup Verification

### 1. API Key Configuration
- [ ] Verify `GOOGLE_PLACES_API_KEY` is set in DigitalOcean environment variables
- [ ] Verify `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set (for client-side fallback)
- [ ] Check API key has Google Places API enabled in Google Cloud Console
- [ ] Verify API key has proper restrictions (HTTP referrers for production)

### 2. Database Setup
- [ ] Verify `enrichment_cache` table exists in Supabase
- [ ] Verify RLS policies allow anonymous reads
- [ ] Verify table has correct columns: `id`, `type`, `key`, `data`, `timestamp`
- [ ] Check that table can be queried without 406 errors

## Manual Testing Checklist

### Canvas Form - Basic Functionality

#### Test Case 1: Simple Company Search
1. [ ] Navigate to `/intake`
2. [ ] Select "Kingston" as territory
3. [ ] Type "Island Grill" in Business Name field
4. [ ] Wait for 1 second after typing stops
5. [ ] **Expected**: Company information box appears showing:
   - Industry: Restaurant
   - Address
   - Phone number
   - Website (if available)
   - Rating and reviews

#### Test Case 2: Company Not Found
1. [ ] Clear Business Name field
2. [ ] Type "XYZABC123 Fake Company"
3. [ ] Wait for search to complete
4. [ ] **Expected**: "No results found for this business name" message

#### Test Case 3: Network Error Handling
1. [ ] Open browser DevTools > Network tab
2. [ ] Set throttling to "Offline"
3. [ ] Type a company name
4. [ ] **Expected**: No crash, error handled gracefully
5. [ ] Set network back to "Online"

### Different Business Types

#### Test Case 4: Bank
- [ ] Type "NCB" or "National Commercial Bank"
- [ ] **Expected**: Shows as financial institution

#### Test Case 5: Pharmacy
- [ ] Type "Fontana Pharmacy"
- [ ] **Expected**: Shows as pharmacy/health

#### Test Case 6: Telecommunications
- [ ] Type "Digicel" or "Flow"
- [ ] **Expected**: Shows as telecommunications

#### Test Case 7: Retail Store
- [ ] Type "Courts" or "MegaMart"
- [ ] **Expected**: Shows as store/retail

### Territory-Specific Searches

#### Test Case 8: Different Parishes
Test with each territory:
- [ ] Kingston - "Devon House"
- [ ] St. Andrew - "Sovereign Centre"
- [ ] Montego Bay - "Sandals Resort"
- [ ] Ocho Rios - "Dunn's River Falls"
- [ ] **Expected**: Results should be location-specific

### Performance Testing

#### Test Case 9: Debouncing
1. [ ] Type quickly: "I-s-l-a-n-d G-r-i-l-l"
2. [ ] Watch Network tab in DevTools
3. [ ] **Expected**: Only 1 API call after typing stops

#### Test Case 10: Cache Verification
1. [ ] Type "Island Grill" and wait for results
2. [ ] Clear field
3. [ ] Type "Island Grill" again
4. [ ] Check Network tab
5. [ ] **Expected**: Second search should be faster (from cache)

### Special Characters

#### Test Case 11: Apostrophes and Special Chars
Test these business names:
- [ ] "Lee's Food Store" (apostrophe)
- [ ] "A&W Restaurant" (ampersand)
- [ ] "Café Blue" (accented character)
- [ ] "Company (Jamaica) Ltd." (parentheses)
- [ ] **Expected**: All should search without errors

### Edge Cases

#### Test Case 12: Very Short Names
- [ ] Type "NCB" (3 characters)
- [ ] **Expected**: Should trigger search

#### Test Case 13: Very Long Names
- [ ] Type a 50+ character business name
- [ ] **Expected**: Should handle without error

#### Test Case 14: Rapid Changes
1. [ ] Type "Island"
2. [ ] Quickly change to "NCB"
3. [ ] Quickly change to "Digicel"
4. [ ] **Expected**: Only searches for final value

### Browser Console Checks

#### Test Case 15: Console Errors
During all tests above, check browser console for:
- [ ] No 406 (Not Acceptable) errors
- [ ] No 401 (Unauthorized) errors
- [ ] No uncaught JavaScript errors
- [ ] API responses logged correctly

### Production Environment

#### Test Case 16: Production Deployment
1. [ ] Deploy to production
2. [ ] Test on production URL
3. [ ] Verify API key works in production
4. [ ] Check that results appear
5. [ ] Verify no CORS errors

## API Response Validation

### Check Response Structure
For a successful search, verify the response contains:
- [ ] `success: true`
- [ ] `data` object with:
  - [ ] `name`
  - [ ] `location` object with `address`
  - [ ] `contact` object (may have null values)
  - [ ] `additionalInfo` object
- [ ] `source` (either 'google_places' or 'cache')
- [ ] `timestamp`

## Performance Metrics

Record these metrics:
- [ ] Time to first result: _____ ms
- [ ] Cache hit rate: _____ %
- [ ] API error rate: _____ %
- [ ] Average response time: _____ ms

## Security Checklist

- [ ] API key not exposed in client-side code
- [ ] API key has domain restrictions in production
- [ ] No sensitive data logged to console
- [ ] Rate limiting in place

## Troubleshooting Guide

### If you see 406 errors:
1. Run the SQL script: `scripts/fix-enrichment-cache-full-access.sql`
2. Wait 15 seconds for PostgREST to reload
3. Hard refresh the browser

### If no results appear:
1. Check browser console for errors
2. Verify API key in environment variables
3. Check Network tab for API responses
4. Verify Google Places API is enabled in Google Cloud Console

### If results are incorrect:
1. Check the search query being sent
2. Verify territory is included in search
3. Check if Google has data for that business

## Automated Test Execution

Run the automated test suite:
```bash
# Run unit tests
npm test src/__tests__/google-places-api.test.ts

# Run integration tests
npm test src/__tests__/integration/intake-form-enrichment.test.tsx

# Run API verification script
npx tsx scripts/test-google-places-api.ts
```

## Sign-off

- [ ] All manual tests pass
- [ ] All automated tests pass
- [ ] No console errors in production
- [ ] Performance meets requirements
- [ ] Security requirements met

**Tested by**: _________________
**Date**: _________________
**Environment**: _________________
**Notes**: _________________