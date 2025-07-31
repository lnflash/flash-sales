import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsernameMismatch() {
  console.log('=== DEBUGGING USERNAME MISMATCH ===\n');

  // 1. Check all variations of "charms" in users table
  console.log('1. Checking users table for variations of "charms":');
  const { data: userVariations, error: userError } = await supabase
    .from('users')
    .select('id, username, email, first_name, last_name')
    .or('username.ilike.%charms%,email.ilike.%charms%,first_name.ilike.%charms%,last_name.ilike.%charms%');

  if (userError) {
    console.error('Error:', userError);
  } else {
    console.log('Found users:', userVariations);
  }

  // 2. Check deals owned by any of these users
  if (userVariations && userVariations.length > 0) {
    for (const user of userVariations) {
      const { count } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      console.log(`\nUser ${user.username || user.email} (ID: ${user.id}) owns ${count} deals`);
    }
  }

  // 3. Check if there are deals without owner_id
  const { count: unownedCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .is('owner_id', null);
  
  console.log(`\n3. Deals without owner_id: ${unownedCount}`);

  // 4. Sample some deals to see their owner information
  console.log('\n4. Sample of deals with owner info:');
  const { data: sampleDeals } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      owner_id,
      organization:organizations!organization_id(name),
      owner:users!owner_id(id, username, email)
    `)
    .limit(20);

  sampleDeals?.forEach((deal: any) => {
    console.log(`Deal: ${deal.name || deal.organization?.name} → Owner: ${deal.owner?.username || deal.owner?.email || 'NO OWNER'} (ID: ${deal.owner_id})`);
  });

  // 5. Check what the auth system uses
  console.log('\n5. What field does the auth system use?');
  console.log('The LoginForm component saves to localStorage:');
  console.log('- username: from user input');
  console.log('- userId: from GraphQL response');
  console.log('- This means the "username" in localStorage might not match the "username" in the database!');

  // 6. Check if emails are being used as usernames
  console.log('\n6. Checking if emails are used as usernames:');
  const { data: emailUsers } = await supabase
    .from('users')
    .select('username, email')
    .is('username', null)
    .limit(10);
  
  console.log('Users with null username:', emailUsers);

  // 7. Final recommendation
  console.log('\n=== RECOMMENDATION ===');
  console.log('The issue appears to be that:');
  console.log('1. The login system saves the user input as "username" in localStorage');
  console.log('2. But the database might have different values in the username field');
  console.log('3. We should match by email instead of username for more reliability');
}

debugUsernameMismatch().catch(console.error);