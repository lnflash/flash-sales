#!/bin/bash

echo "Running Territory Functionality Tests..."
echo "======================================="

echo -e "\n1. Territory Helper Functions:"
npm test -- --testPathPattern="territory-helpers" --silent 2>&1 | tail -3

echo -e "\n2. Territory Filtering:"
npm test -- --testPathPattern="territory-filtering" --silent 2>&1 | tail -3

echo -e "\n3. Territory Assignment:"
npm test -- --testPathPattern="territory-assignment" --silent 2>&1 | tail -3

echo -e "\n4. Territory Dashboard:"
npm test -- --testPathPattern="TerritoryDashboard" --silent 2>&1 | tail -3

echo -e "\n5. Backward Compatibility:"
npm test -- --testPathPattern="backward-compatibility" --silent 2>&1 | tail -3

echo -e "\n6. Country Toggle Component:"
npm test -- --testPathPattern="CountryToggle" --silent 2>&1 | tail -3

echo -e "\n========================================="
echo "Overall Territory Test Summary:"
npm test -- --testPathPattern="territories" --silent 2>&1 | grep -E "(Test Suites|Tests:|Time:)" | tail -3