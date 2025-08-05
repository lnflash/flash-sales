#!/bin/bash

# Test script to verify dynamic intake form field persistence
# This script tests that all fields in the dynamic intake form are saved and displayed correctly

echo "================================"
echo "Dynamic Intake Form Field Test"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

echo "📋 Testing Dynamic Intake Form Field Persistence..."
echo ""

# Test 1: Check if all fields are mapped in mapDealToSubmission
echo "1. Checking field mapping in supabase-api.ts..."
grep -q "email: metadata.email" src/lib/supabase-api.ts && \
grep -q "businessType: metadata.businessType" src/lib/supabase-api.ts && \
grep -q "monthlyRevenue: metadata.monthlyRevenue" src/lib/supabase-api.ts && \
grep -q "numberOfEmployees: metadata.numberOfEmployees" src/lib/supabase-api.ts && \
grep -q "yearEstablished: metadata.yearEstablished" src/lib/supabase-api.ts && \
grep -q "currentProcessor: metadata.currentProcessor" src/lib/supabase-api.ts && \
grep -q "monthlyTransactions: metadata.monthlyTransactions" src/lib/supabase-api.ts && \
grep -q "averageTicketSize: metadata.averageTicketSize" src/lib/supabase-api.ts && \
grep -q "painPoints: metadata.painPoints" src/lib/supabase-api.ts
print_result $? "All fields are mapped in mapDealToSubmission"

# Test 2: Check if DynamicIntakeForm loads from both custom_fields and metadata
echo ""
echo "2. Checking DynamicIntakeForm field loading..."
grep -q "const metadataSource = deal.custom_fields || deal.metadata || {}" src/components/intake/DynamicIntakeForm.tsx
print_result $? "DynamicIntakeForm checks both custom_fields and metadata"

# Test 3: Check if SubmissionDetail displays all fields
echo ""
echo "3. Checking SubmissionDetail field display..."
grep -q "{submission.email &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.businessType &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.monthlyRevenue &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.numberOfEmployees &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.yearEstablished &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.currentProcessor &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.monthlyTransactions &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.averageTicketSize &&" src/components/submissions/SubmissionDetail.tsx && \
grep -q "{submission.painPoints && submission.painPoints.length > 0 &&" src/components/submissions/SubmissionDetail.tsx
print_result $? "All fields are displayed in SubmissionDetail"

# Test 4: Check if submission types include all fields
echo ""
echo "4. Checking submission types..."
grep -q "email?: string;" src/types/submission.ts && \
grep -q "businessType?: string;" src/types/submission.ts && \
grep -q "monthlyRevenue?: string;" src/types/submission.ts && \
grep -q "numberOfEmployees?: string;" src/types/submission.ts && \
grep -q "yearEstablished?: string;" src/types/submission.ts && \
grep -q "currentProcessor?: string;" src/types/submission.ts && \
grep -q "monthlyTransactions?: string;" src/types/submission.ts && \
grep -q "averageTicketSize?: string;" src/types/submission.ts && \
grep -q "painPoints?: string\[\];" src/types/submission.ts
print_result $? "All fields are defined in submission types"

# Test 5: Run unit tests
echo ""
echo "5. Running unit tests..."
npm test -- src/lib/__tests__/supabase-api.test.ts --no-coverage --silent 2>&1 > /dev/null
print_result $? "Unit tests pass"

echo ""
echo "================================"
echo "📊 Summary:"
echo "================================"
echo ""
echo "The dynamic intake form should now:"
echo "✅ Save all fields to the custom_fields column"
echo "✅ Load data from both custom_fields and metadata (for backward compatibility)"
echo "✅ Display all fields in the submission detail view"
echo "✅ Map all fields correctly in the API layer"
echo ""
echo "To test manually:"
echo "1. Go to /intake-dynamic and create a new submission with all fields filled"
echo "2. Navigate to the submission detail page to verify all fields are displayed"
echo "3. Edit the submission and verify all fields are loaded correctly"
echo "4. Save the edited submission and verify all changes persist"
echo ""