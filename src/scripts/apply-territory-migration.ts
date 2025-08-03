#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🌴 Applying Caribbean Territory Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../../supabase/migrations/20240803_caribbean_territories.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split by semicolons but be careful with functions
    const statements = migrationSQL
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      // Get first line for logging
      const firstLine = statement.split('\n')[0].substring(0, 50);
      console.log(`Executing ${i + 1}/${statements.length}: ${firstLine}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).single();
      
      if (error) {
        // Try direct execution if RPC fails
        console.log('   Trying alternative method...');
        
        // For this, we would need to use the Supabase SQL editor
        // or apply through the dashboard
        console.error(`   ❌ Failed: ${error.message}`);
        console.log('\n⚠️  Please apply the migration manually through Supabase dashboard:');
        console.log('   1. Go to https://supabase.com/dashboard/project/pgsxczfkjbtgzcauxuur/sql/new');
        console.log('   2. Copy contents of supabase/migrations/20240803_caribbean_territories.sql');
        console.log('   3. Paste and run in SQL editor');
        return;
      }
      
      console.log('   ✅ Success');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNow run: npm run test:territories');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    console.log('\n💡 Alternative: Apply migration manually through Supabase dashboard');
    process.exit(1);
  }
}

// Note about manual application
console.log('📝 Note: This script attempts to apply the migration programmatically.');
console.log('   If it fails, you can apply it manually through the Supabase SQL editor.\n');

// Run the migration
applyMigration();