#!/usr/bin/env node
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error('❌ SUPABASE_PROJECT_ID not found in .env.local');
  console.error('Add: SUPABASE_PROJECT_ID=pgsxczfkjbtgzcauxuur');
  process.exit(1);
}

console.log(`📝 Generating types for project: ${projectId}`);

try {
  // Generate types
  execSync(
    `npx supabase gen types typescript --project-id ${projectId} > src/types/database.ts`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ Types generated successfully at src/types/database.ts');
} catch (error) {
  console.error('❌ Failed to generate types:', error);
  process.exit(1);
}