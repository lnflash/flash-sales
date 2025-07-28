import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Configuration
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

// Initialize Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

// Legacy API configuration
const LEGACY_API_URL = process.env.INTAKE_API_URL || 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

interface LegacySubmission {
  id: number;
  ownerName: string;
  phoneNumber?: string;
  packageSeen: boolean;
  decisionMakers?: string;
  interestLevel: number;
  signedUp: boolean;
  specificNeeds?: string;
  timestamp: string;
  username?: string;
}

interface MigrationStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ id: number; error: string }>;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all submissions from legacy API
async function fetchLegacySubmissions(): Promise<LegacySubmission[]> {
  console.log('📥 Fetching submissions from legacy API...');
  
  try {
    const response = await fetch(`${LEGACY_API_URL}/submissions?limit=10000`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch submissions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.data.length} submissions`);
    return data.data;
  } catch (error) {
    console.error('❌ Error fetching legacy submissions:', error);
    throw error;
  }
}

// Create or find user by username
async function findOrCreateUser(username?: string): Promise<string | null> {
  if (!username) return null;

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${username},full_name.ilike.%${username}%`)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // Create a placeholder user for unknown sales reps
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email: `${username.toLowerCase().replace(/\s+/g, '.')}@flashbitcoin.com`,
      first_name: username.split(' ')[0] || username,
      last_name: username.split(' ')[1] || 'Rep',
      role: 'sales_rep',
      status: 'inactive', // Mark as inactive since we don't have auth for them
    })
    .select('id')
    .single();

  if (error) {
    console.warn(`⚠️  Could not create user for ${username}:`, error.message);
    return null;
  }

  return newUser.id;
}

// Migrate a single submission
async function migrateSubmission(submission: LegacySubmission): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create or find organization
    let orgId: string;
    
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: submission.ownerName,
        source: 'legacy_intake_form',
        status: 'lead',
        lifecycle_stage: submission.signedUp ? 'customer' : 'lead',
        custom_fields: {
          legacy_id: submission.id,
          import_date: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (orgError) {
      // Try to find existing org
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', submission.ownerName)
        .single();

      if (!existingOrg) {
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }
      orgId = existingOrg.id;
    } else {
      orgId = newOrg.id;
    }

    // 2. Create contact if phone number exists
    let contactId: string | null = null;
    if (submission.phoneNumber) {
      const nameParts = submission.ownerName.split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Contact';

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          first_name: firstName,
          last_name: lastName,
          phone_primary: submission.phoneNumber,
          is_primary_contact: true,
          is_decision_maker: !!submission.decisionMakers,
          notes: submission.decisionMakers ? `Decision makers: ${submission.decisionMakers}` : undefined,
        })
        .select('id')
        .single();

      if (contactError) {
        console.warn(`⚠️  Could not create contact for ${submission.ownerName}:`, contactError.message);
      } else {
        contactId = contact.id;
      }
    }

    // 3. Find or create user (sales rep)
    const userId = await findOrCreateUser(submission.username);

    // 4. Create deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        organization_id: orgId,
        primary_contact_id: contactId,
        owner_id: userId,
        name: `${submission.ownerName} - Deal`,
        description: `Imported from legacy intake form (ID: ${submission.id})`,
        stage: submission.signedUp ? 'Closed Won' : 'Qualification',
        status: submission.signedUp ? 'won' : 'open',
        interest_level: submission.interestLevel,
        package_seen: submission.packageSeen,
        specific_needs: submission.specificNeeds,
        decision_makers: submission.decisionMakers,
        source: 'legacy_intake_form',
        created_at: new Date(submission.timestamp).toISOString(),
        closed_at: submission.signedUp ? new Date(submission.timestamp).toISOString() : null,
        custom_fields: {
          legacy_id: submission.id,
          legacy_timestamp: submission.timestamp,
        },
      })
      .select('id')
      .single();

    if (dealError) {
      throw new Error(`Failed to create deal: ${dealError.message}`);
    }

    // 5. Create initial activity (note about import)
    await supabase
      .from('activities')
      .insert({
        deal_id: deal.id,
        organization_id: orgId,
        contact_id: contactId,
        owner_id: userId,
        type: 'note',
        subject: 'Imported from legacy system',
        description: `This deal was imported from the legacy intake form system. Original submission ID: ${submission.id}`,
        status: 'completed',
        created_at: new Date(submission.timestamp).toISOString(),
      });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Main migration function
export async function runMigration() {
  console.log('🚀 Starting Supabase migration...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📍 Legacy API URL: ${LEGACY_API_URL}`);

  const stats: MigrationStats = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    // 1. Create migration status record
    const { data: migration } = await supabase
      .from('migration_status')
      .insert({
        migration_name: 'legacy_submissions_import',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // 2. Fetch all legacy submissions
    const submissions = await fetchLegacySubmissions();
    stats.total = submissions.length;

    // 3. Process in batches
    for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
      const batch = submissions.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, submissions.length)} of ${submissions.length})`);

      // Process batch in parallel
      const results = await Promise.all(
        batch.map(submission => migrateSubmission(submission))
      );

      // Update stats
      results.forEach((result, index) => {
        stats.processed++;
        if (result.success) {
          stats.successful++;
        } else {
          stats.failed++;
          stats.errors.push({
            id: batch[index].id,
            error: result.error || 'Unknown error',
          });
        }
      });

      // Progress update
      const progress = ((stats.processed / stats.total) * 100).toFixed(1);
      console.log(`✅ Progress: ${progress}% (${stats.successful} successful, ${stats.failed} failed)`);

      // Update migration status
      if (migration) {
        await supabase
          .from('migration_status')
          .update({
            records_processed: stats.processed,
          })
          .eq('id', migration.id);
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < submissions.length) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    // 4. Update migration status
    if (migration) {
      await supabase
        .from('migration_status')
        .update({
          status: stats.failed === 0 ? 'completed' : 'completed_with_errors',
          completed_at: new Date().toISOString(),
          records_processed: stats.processed,
          error_message: stats.failed > 0 ? `${stats.failed} records failed to migrate` : null,
        })
        .eq('id', migration.id);
    }

    // 5. Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total submissions: ${stats.total}`);
    console.log(`Successfully migrated: ${stats.successful} (${((stats.successful / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${stats.failed}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.slice(0, 10).forEach(error => {
        console.log(`  - Submission ${error.id}: ${error.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n✨ Migration completed!');
    
    // 6. Post-migration tasks
    console.log('\n🔧 Running post-migration tasks...');
    
    // Refresh materialized views
    await supabase.rpc('refresh_sales_performance_metrics');
    
    console.log('✅ Post-migration tasks completed');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    
    // Update migration status
    await supabase
      .from('migration_status')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('migration_name', 'legacy_submissions_import');
    
    throw error;
  }

  return stats;
}

// Verification function to check migration results
export async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  const checks = {
    organizations: 0,
    contacts: 0,
    deals: 0,
    activities: 0,
    users: 0,
  };

  // Count records in each table
  const { count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });
  checks.organizations = orgCount || 0;

  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  checks.contacts = contactCount || 0;

  const { count: dealCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
  checks.deals = dealCount || 0;

  const { count: activityCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true });
  checks.activities = activityCount || 0;

  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  checks.users = userCount || 0;

  console.log('\n📊 VERIFICATION RESULTS:');
  console.log(`Organizations: ${checks.organizations}`);
  console.log(`Contacts: ${checks.contacts}`);
  console.log(`Deals: ${checks.deals}`);
  console.log(`Activities: ${checks.activities}`);
  console.log(`Users: ${checks.users}`);

  return checks;
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => verifyMigration())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}