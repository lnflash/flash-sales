#\!/bin/bash

# Script to create missing tables in Supabase

echo "Creating missing tables in Supabase..."

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL environment variable is not set"
    echo "Please set it with: export SUPABASE_DB_URL='your_database_url'"
    exit 1
fi

# Run the SQL script
psql "$SUPABASE_DB_URL" -f sql/create_missing_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully\!"
else
    echo "❌ Error creating tables"
    exit 1
fi
