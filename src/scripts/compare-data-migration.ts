import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const EXTERNAL_API_URL = 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ExternalSubmission {
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
  territory?: string;
}

interface ComparisonResult {
  totalExternal: number;
  totalSupabase: number;
  matched: number;
  missingInSupabase: ExternalSubmission[];
  dataDiscrepancies: Array<{
    externalId: number;
    field: string;
    externalValue: any;
    supabaseValue: any;
  }>;
}

async function fetchExternalSubmissions(): Promise<ExternalSubmission[]> {
  try {
    console.log('Fetching submissions from external API...');
    const response = await fetch(`${EXTERNAL_API_URL}/submissions?limit=1000`);
    
    if (!response.ok) {
      throw new Error(`External API returned ${response.status}`);
    }
    
    const data = await response.json() as any;
    console.log(`Fetched ${data.data?.length || 0} submissions from external API`);
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching from external API:', error);
    return [];
  }
}

async function fetchSupabaseDeals() {
  console.log('Fetching deals from Supabase...');
  
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      organization:organizations!organization_id(name, state_province),
      primary_contact:contacts!primary_contact_id(phone_primary),
      owner:users!owner_id(email, username)
    `)
    .order('created_at', { ascending: false })
    .limit(1000);
  
  if (error) {
    console.error('Error fetching from Supabase:', error);
    return [];
  }
  
  console.log(`Fetched ${data?.length || 0} deals from Supabase`);
  return data || [];
}

function normalizePhoneNumber(phone?: string): string {
  if (!phone) return '';
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

function compareData(): ComparisonResult {
  const result: ComparisonResult = {
    totalExternal: 0,
    totalSupabase: 0,
    matched: 0,
    missingInSupabase: [],
    dataDiscrepancies: []
  };
  
  return result;
}

async function main() {
  console.log('Starting data migration comparison...\n');
  
  // Fetch data from both sources
  const [externalSubmissions, supabaseDeals] = await Promise.all([
    fetchExternalSubmissions(),
    fetchSupabaseDeals()
  ]);
  
  const result: ComparisonResult = {
    totalExternal: externalSubmissions.length,
    totalSupabase: supabaseDeals.length,
    matched: 0,
    missingInSupabase: [],
    dataDiscrepancies: []
  };
  
  // Create a map of Supabase deals by organization name for easier lookup
  const supabaseByOrgName = new Map<string, any>();
  const supabaseByPhone = new Map<string, any>();
  
  supabaseDeals.forEach(deal => {
    const orgName = deal.organization?.name || deal.name;
    const phone = normalizePhoneNumber(deal.primary_contact?.phone_primary);
    
    if (orgName) {
      supabaseByOrgName.set(orgName.toLowerCase(), deal);
    }
    if (phone) {
      supabaseByPhone.set(phone, deal);
    }
  });
  
  // Compare each external submission
  for (const external of externalSubmissions) {
    // Try to find matching deal in Supabase
    let supabaseDeal = null;
    
    // First try by organization name
    if (external.ownerName) {
      supabaseDeal = supabaseByOrgName.get(external.ownerName.toLowerCase());
    }
    
    // If not found, try by phone number
    if (!supabaseDeal && external.phoneNumber) {
      const normalizedPhone = normalizePhoneNumber(external.phoneNumber);
      supabaseDeal = supabaseByPhone.get(normalizedPhone);
    }
    
    if (!supabaseDeal) {
      result.missingInSupabase.push(external);
      continue;
    }
    
    result.matched++;
    
    // Compare field values
    const comparisons = [
      {
        field: 'ownerName',
        external: external.ownerName,
        supabase: supabaseDeal.organization?.name || supabaseDeal.name
      },
      {
        field: 'phoneNumber',
        external: normalizePhoneNumber(external.phoneNumber),
        supabase: normalizePhoneNumber(supabaseDeal.primary_contact?.phone_primary)
      },
      {
        field: 'packageSeen',
        external: external.packageSeen,
        supabase: supabaseDeal.package_seen
      },
      {
        field: 'decisionMakers',
        external: external.decisionMakers || '',
        supabase: supabaseDeal.decision_makers || ''
      },
      {
        field: 'interestLevel',
        external: external.interestLevel,
        supabase: supabaseDeal.interest_level
      },
      {
        field: 'signedUp',
        external: external.signedUp,
        supabase: supabaseDeal.status === 'won'
      },
      {
        field: 'specificNeeds',
        external: external.specificNeeds || '',
        supabase: supabaseDeal.specific_needs || ''
      },
      {
        field: 'username',
        external: external.username || '',
        supabase: supabaseDeal.owner?.email?.split('@')[0] || ''
      },
      {
        field: 'territory',
        external: external.territory || '',
        supabase: supabaseDeal.organization?.state_province || ''
      }
    ];
    
    for (const comp of comparisons) {
      if (comp.external !== comp.supabase) {
        // Special handling for empty vs null/undefined
        if (!comp.external && !comp.supabase) continue;
        
        result.dataDiscrepancies.push({
          externalId: external.id,
          field: comp.field,
          externalValue: comp.external,
          supabaseValue: comp.supabase
        });
      }
    }
  }
  
  // Generate report
  console.log('\n=== MIGRATION COMPARISON REPORT ===\n');
  console.log(`Total submissions in external API: ${result.totalExternal}`);
  console.log(`Total deals in Supabase: ${result.totalSupabase}`);
  console.log(`Successfully matched: ${result.matched}`);
  console.log(`Missing in Supabase: ${result.missingInSupabase.length}`);
  console.log(`Data discrepancies found: ${result.dataDiscrepancies.length}`);
  
  if (result.missingInSupabase.length > 0) {
    console.log('\n--- MISSING IN SUPABASE ---');
    console.log('The following submissions were not found in Supabase:');
    result.missingInSupabase.slice(0, 10).forEach(sub => {
      console.log(`  ID: ${sub.id}, Name: ${sub.ownerName}, Phone: ${sub.phoneNumber}`);
    });
    if (result.missingInSupabase.length > 10) {
      console.log(`  ... and ${result.missingInSupabase.length - 10} more`);
    }
  }
  
  if (result.dataDiscrepancies.length > 0) {
    console.log('\n--- DATA DISCREPANCIES ---');
    console.log('Fields that don\'t match between external and Supabase:');
    
    // Group discrepancies by field
    const discrepanciesByField = new Map<string, number>();
    result.dataDiscrepancies.forEach(disc => {
      discrepanciesByField.set(disc.field, (discrepanciesByField.get(disc.field) || 0) + 1);
    });
    
    discrepanciesByField.forEach((count, field) => {
      console.log(`  ${field}: ${count} mismatches`);
    });
    
    // Show a few examples
    console.log('\nExample discrepancies:');
    result.dataDiscrepancies.slice(0, 5).forEach(disc => {
      console.log(`  External ID ${disc.externalId}, Field: ${disc.field}`);
      console.log(`    External: "${disc.externalValue}"`);
      console.log(`    Supabase: "${disc.supabaseValue}"`);
    });
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  if (result.missingInSupabase.length === 0 && result.dataDiscrepancies.length === 0) {
    console.log('✅ All data has been successfully migrated!');
  } else {
    console.log('⚠️  Some issues found in the migration:');
    if (result.missingInSupabase.length > 0) {
      console.log(`   - ${result.missingInSupabase.length} submissions are missing in Supabase`);
    }
    if (result.dataDiscrepancies.length > 0) {
      console.log(`   - ${result.dataDiscrepancies.length} field values don't match`);
    }
  }
  
  // Export detailed results to a file
  const detailedResults = {
    summary: result,
    missingSubmissions: result.missingInSupabase,
    discrepancies: result.dataDiscrepancies
  };
  
  const fs = await import('fs');
  fs.writeFileSync(
    'migration-comparison-results.json',
    JSON.stringify(detailedResults, null, 2)
  );
  console.log('\nDetailed results saved to: migration-comparison-results.json');
}

main().catch(console.error);