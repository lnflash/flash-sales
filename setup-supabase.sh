#!/bin/bash

# Flash CRM Supabase Setup Script
# This script helps automate the Supabase setup process

set -e

echo "🚀 Flash CRM Supabase Setup"
echo "=========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ .env.local created. Please update it with your Supabase credentials."
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react @supabase/realtime-js

# Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install -D supabase

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing globally..."
    npm install -g supabase
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p src/lib/supabase
mkdir -p src/hooks/supabase
mkdir -p src/types
mkdir -p supabase/migrations

# Create example environment file if it doesn't exist
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Legacy API (for migration period)
INTAKE_API_URL=https://flash-intake-form-3xgvo.ondigitalocean.app/api
EOF
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a Supabase project at https://app.supabase.com"
echo "2. Update .env.local with your Supabase credentials"
echo "3. Run 'npm run supabase:link' to link your project"
echo "4. Run 'npm run supabase:setup' to create the schema"
echo "5. Run 'npm run migrate:legacy' to import existing data"
echo ""
echo "For detailed instructions, see SUPABASE_SETUP_GUIDE.md"