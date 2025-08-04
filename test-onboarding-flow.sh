#!/bin/bash

echo "=== Testing Onboarding Flow ==="
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check if onboarding store is initialized correctly
echo -e "${YELLOW}Test 1: Onboarding Store Initialization${NC}"
echo "Checking if onboarding store persists data correctly..."
node -e "
const { useOnboardingStore } = require('./src/stores/useOnboardingStore');
const store = useOnboardingStore.getState();
console.log('Initial state:', {
  isActive: store.isActive,
  currentStep: store.currentStep,
  hasCompletedOnboarding: store.hasCompletedOnboarding
});
"
echo

# Test 2: Check if all onboarding components exist
echo -e "${YELLOW}Test 2: Onboarding Components${NC}"
components=(
  "src/components/onboarding/WelcomeModal.tsx"
  "src/components/onboarding/RoleSelectionModal.tsx"
  "src/components/onboarding/InteractiveTour.tsx"
  "src/components/onboarding/QuickSetupChecklist.tsx"
  "src/components/onboarding/HelpMenu.tsx"
  "src/components/onboarding/OnboardingFlow.tsx"
)

for component in "${components[@]}"; do
  if [ -f "$component" ]; then
    echo -e "${GREEN}✓${NC} $component exists"
  else
    echo -e "${RED}✗${NC} $component missing"
  fi
done
echo

# Test 3: Check if data-tour attributes are added to components
echo -e "${YELLOW}Test 3: Data-tour Attributes${NC}"
echo "Checking for data-tour attributes in dashboard components..."

# Check Weekly Program page
if grep -q 'data-tour=' src/pages/dashboard/weekly-program.tsx; then
  echo -e "${GREEN}✓${NC} Weekly Program page has data-tour attributes"
else
  echo -e "${RED}✗${NC} Weekly Program page missing data-tour attributes"
fi

# Check Rep Tracking page
if grep -q 'data-tour=' src/pages/dashboard/rep-tracking.tsx; then
  echo -e "${GREEN}✓${NC} Rep Tracking page has data-tour attributes"
else
  echo -e "${RED}✗${NC} Rep Tracking page missing data-tour attributes"
fi

# Check Leads page
if grep -q 'data-tour=' src/pages/dashboard/leads.tsx; then
  echo -e "${GREEN}✓${NC} Leads page has data-tour attributes"
else
  echo -e "${RED}✗${NC} Leads page missing data-tour attributes"
fi
echo

# Test 4: Check tour steps configuration
echo -e "${YELLOW}Test 4: Tour Steps Configuration${NC}"
echo "Checking if tour steps are properly configured..."
if grep -q 'tourSteps' src/components/onboarding/InteractiveTour.tsx; then
  echo -e "${GREEN}✓${NC} Tour steps are configured"
  grep -A 5 'const.*Steps' src/components/onboarding/InteractiveTour.tsx | head -20
else
  echo -e "${RED}✗${NC} Tour steps not found"
fi
echo

# Test 5: Check if onboarding is integrated into DashboardLayout
echo -e "${YELLOW}Test 5: Dashboard Integration${NC}"
if grep -q 'OnboardingFlow' src/components/layout/DashboardLayout.tsx; then
  echo -e "${GREEN}✓${NC} Onboarding is integrated into DashboardLayout"
else
  echo -e "${RED}✗${NC} Onboarding not integrated into DashboardLayout"
fi
echo

# Test 6: Simulate onboarding flow
echo -e "${YELLOW}Test 6: Simulating Onboarding Flow${NC}"
echo "Testing onboarding flow progression..."
node -e "
const { useOnboardingStore } = require('./src/stores/useOnboardingStore');

// Get initial state
const store = useOnboardingStore.getState();
console.log('1. Initial state:', store.currentStep);

// Start onboarding
store.startOnboarding();
console.log('2. After start:', store.currentStep);

// Select role
store.setSelectedRole('Flash Rep');
console.log('3. Selected role:', store.selectedRole);

// Progress through steps
store.nextStep();
console.log('4. Next step:', store.currentStep);

// Complete a setup task
store.markSetupTaskComplete('profile_setup');
console.log('5. Completed tasks:', store.completedSetupTasks);

// Skip onboarding
store.skipOnboarding();
console.log('6. Has completed:', store.hasCompletedOnboarding);
"
echo

echo -e "${GREEN}=== Onboarding Flow Test Complete ===${NC}"
echo "To manually test the onboarding flow:"
echo "1. Clear your browser's localStorage"
echo "2. Navigate to http://localhost:3000"
echo "3. Log in as a new user"
echo "4. The onboarding flow should automatically start"
echo
echo "Features to test:"
echo "- Welcome modal appears"
echo "- Role selection works"
echo "- Interactive tour guides through features"
echo "- Quick setup checklist tracks progress"
echo "- Help menu allows restarting tour"
echo "- Onboarding state persists across sessions"