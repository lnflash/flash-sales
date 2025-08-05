#!/bin/bash

# Test script for Hybrid Program of Work functionality
# This script helps verify that the hybrid storage implementation is working correctly

echo "=== Testing Hybrid Program of Work Implementation ==="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "1. Checking prerequisites..."
if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

if ! command_exists supabase; then
    echo -e "${RED}✗ Supabase CLI is not installed${NC}"
    echo "   Install with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Check if migrations have been applied
echo "2. Checking if migrations have been applied..."
echo "   Run this command to check migration status:"
echo -e "${YELLOW}   supabase db diff${NC}"
echo ""

# Start the development server
echo "3. Starting development server..."
echo "   Run this command in a separate terminal:"
echo -e "${YELLOW}   npm run dev${NC}"
echo ""

# Test scenarios
echo "4. Test Scenarios to Verify:"
echo ""
echo "   ${YELLOW}A. Offline Functionality Test:${NC}"
echo "      1. Open the app at http://localhost:3000"
echo "      2. Navigate to Weekly Program of Work"
echo "      3. Open browser DevTools > Network tab"
echo "      4. Set network to 'Offline'"
echo "      5. Create a new activity"
echo "      6. Verify the activity appears in the calendar"
echo "      7. Check localStorage in DevTools > Application > Local Storage"
echo "      8. Verify 'weekly-program-store' contains your activity"
echo ""
echo "   ${YELLOW}B. Online Sync Test:${NC}"
echo "      1. Set network back to 'Online'"
echo "      2. Watch the sync indicator in the top-right"
echo "      3. It should show 'Syncing...' then 'Synced'"
echo "      4. Check Supabase dashboard for 'program_activities' table"
echo "      5. Verify your activity was synced"
echo ""
echo "   ${YELLOW}C. Admin Visibility Test:${NC}"
echo "      1. Log in as a regular sales rep"
echo "      2. Create some activities in Weekly Program"
echo "      3. Log out and log in as an admin"
echo "      4. Navigate to Rep Tracking page"
echo "      5. Click on 'Program of Work' tab"
echo "      6. Verify you can see the sales rep's activities"
echo ""
echo "   ${YELLOW}D. Multi-Device Sync Test:${NC}"
echo "      1. Open the app in two different browsers"
echo "      2. Log in with the same account"
echo "      3. Create an activity in browser 1"
echo "      4. Wait 5 minutes (or click sync button)"
echo "      5. Verify activity appears in browser 2"
echo ""
echo "   ${YELLOW}E. Conflict Resolution Test:${NC}"
echo "      1. Go offline in both browsers"
echo "      2. Edit the same activity differently in each"
echo "      3. Go online in browser 1, wait for sync"
echo "      4. Go online in browser 2"
echo "      5. Verify both changes are preserved"
echo ""

# SQL queries to verify data
echo "5. SQL Queries to Verify Data in Supabase:"
echo ""
echo "   Check all synced activities:"
echo -e "${YELLOW}   SELECT * FROM program_activities ORDER BY created_at DESC;${NC}"
echo ""
echo "   Check sync status:"
echo -e "${YELLOW}   SELECT * FROM program_sync_status;${NC}"
echo ""
echo "   Check weekly goals:"
echo -e "${YELLOW}   SELECT * FROM program_weekly_goals;${NC}"
echo ""
echo "   Get activity summary by user:"
echo -e "${YELLOW}   SELECT username, COUNT(*) as total_activities, 
          COUNT(*) FILTER (WHERE status = 'completed') as completed
   FROM program_activities 
   GROUP BY username;${NC}"
echo ""

# Check for common issues
echo "6. Common Issues and Solutions:"
echo ""
echo "   ${RED}Issue:${NC} Sync indicator shows 'Error'"
echo "   ${GREEN}Solution:${NC} Check browser console for errors, verify Supabase connection"
echo ""
echo "   ${RED}Issue:${NC} Activities not syncing"
echo "   ${GREEN}Solution:${NC} Check if user is authenticated, verify RLS policies"
echo ""
echo "   ${RED}Issue:${NC} Admin can't see rep data"
echo "   ${GREEN}Solution:${NC} Verify admin role is 'Flash Management' or 'Flash Admin'"
echo ""

echo "=== Test Script Complete ==="
echo ""
echo "For more detailed testing, check the test files:"
echo "  - __tests__/components/weekly-program/*.test.tsx"
echo "  - __tests__/hooks/useAllRepsProgram.test.tsx"