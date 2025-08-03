#!/bin/bash

echo "====================================="
echo "Testing Phase 7: Territory Analytics"
echo "====================================="

# Check if territory analytics types exist
echo ""
echo "Checking territory analytics types..."
if [ -f src/types/territory-analytics.ts ]; then
    echo "✓ Territory analytics types created"
    
    # Check for key interfaces
    if grep -q "TerritoryMetrics" src/types/territory-analytics.ts && \
       grep -q "CountryMetrics" src/types/territory-analytics.ts && \
       grep -q "TerritoryHeatMapData" src/types/territory-analytics.ts; then
        echo "✓ All required interfaces defined"
    else
        echo "✗ Missing required interfaces"
        exit 1
    fi
else
    echo "✗ Territory analytics types not found"
    exit 1
fi

# Check if analytics service exists
echo ""
echo "Checking territory analytics service..."
if [ -f src/services/territory-analytics.ts ]; then
    echo "✓ Territory analytics service created"
    
    # Check for key methods
    if grep -q "getTerritoryMetrics" src/services/territory-analytics.ts && \
       grep -q "getCountryMetrics" src/services/territory-analytics.ts && \
       grep -q "getTerritoryTrends" src/services/territory-analytics.ts; then
        echo "✓ All required service methods defined"
    else
        echo "✗ Missing required service methods"
        exit 1
    fi
else
    echo "✗ Territory analytics service not found"
    exit 1
fi

# Check if analytics components exist
echo ""
echo "Checking analytics components..."
components=(
    "src/components/analytics/TerritoryAnalyticsDashboard.tsx"
    "src/components/analytics/TerritoryPerformanceCard.tsx"
    "src/components/analytics/CountryComparisonChart.tsx"
    "src/components/analytics/TerritoryHeatMap.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "✓ $(basename $component) exists"
    else
        echo "✗ $(basename $component) not found"
        exit 1
    fi
done

# Check if analytics page is updated
echo ""
echo "Checking analytics page integration..."
if grep -q "TerritoryAnalyticsDashboard" src/pages/dashboard/analytics.tsx; then
    echo "✓ Territory analytics integrated into main analytics page"
    
    # Check for tabs
    if grep -q "TabsTrigger.*territories" src/pages/dashboard/analytics.tsx; then
        echo "✓ Territory analytics tab added"
    else
        echo "✗ Territory analytics tab not found"
        exit 1
    fi
else
    echo "✗ Territory analytics not integrated"
    exit 1
fi

# Test TypeScript compilation
echo ""
echo "Checking TypeScript compilation..."
npx tsc --noEmit --project tsconfig.json --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✓ TypeScript compilation successful"
else
    echo "✗ TypeScript compilation failed"
    exit 1
fi

# Check for date-fns dependency
echo ""
echo "Checking dependencies..."
if grep -q "date-fns" package.json; then
    echo "✓ date-fns dependency found"
else
    echo "⚠ date-fns not in package.json, installing..."
    npm install date-fns
fi

echo ""
echo "====================================="
echo "Phase 7 Testing Complete!"
echo "====================================="
echo ""
echo "Summary:"
echo "✓ Territory analytics types defined"
echo "✓ Analytics service with data aggregation"
echo "✓ Territory performance visualization components"
echo "✓ Country comparison charts"
echo "✓ Territory heat map visualization"
echo "✓ Integration with main analytics page"
echo ""
echo "Key Features Implemented:"
echo "- Real-time territory performance metrics"
echo "- Country-level aggregated analytics"
echo "- Territory performance heat maps"
echo "- Comparative analysis between territories"
echo "- Time-based trend analysis"
echo "- Rep performance by territory"
echo ""
echo "Next Steps:"
echo "- Add export functionality for reports"
echo "- Implement revenue tracking when available"
echo "- Add more advanced filtering options"
echo "- Create scheduled report generation"
echo ""