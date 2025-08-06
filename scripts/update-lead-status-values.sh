#!/bin/bash

# Update lead status values across the codebase to match database constraint
# Database allows: 'new', 'contacted', 'qualified', 'converted', null

echo "Updating lead status values to match database constraint..."

# Replace old values with new ones
# 'canvas' -> 'new'
# 'prospect' -> 'qualified'
# 'opportunity' -> 'qualified'
# 'signed_up' -> 'converted'

# Find all TypeScript/TSX files and update them
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Skip test files for now
  if [[ ! "$file" =~ "__tests__|\.test\." ]]; then
    # Use sed to replace the values
    sed -i '' \
      -e "s/'canvas'/'new'/g" \
      -e "s/\"canvas\"/\"new\"/g" \
      -e "s/'signed_up'/'converted'/g" \
      -e "s/\"signed_up\"/\"converted\"/g" \
      -e "s/'prospect'/'qualified'/g" \
      -e "s/\"prospect\"/\"qualified\"/g" \
      -e "s/'opportunity'/'qualified'/g" \
      -e "s/\"opportunity\"/\"qualified\"/g" \
      "$file"
    
    # Check if file was modified
    if git diff --quiet "$file"; then
      echo "No changes in: $file"
    else
      echo "Updated: $file"
    fi
  fi
done

echo "Done updating lead status values"