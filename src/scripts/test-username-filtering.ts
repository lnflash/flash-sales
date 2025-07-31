import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsernameFiltering() {
  console.log('Testing username filtering...\n');

  // Test 1: Get all users with usernames
  console.log('1. Fetching all users with usernames:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, email')
    .not('username', 'is', null)
    .limit(10);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log('Users found:', users?.length);
  users?.forEach(user => {
    console.log(`  - Username: ${user.username}, Email: ${user.email}, ID: ${user.id}`);
  });

  // Test 2: Test specific username lookup
  const testUsername = 'charms';
  console.log(`\n2. Looking up user '${testUsername}':`);
  
  const { data: charmsUser, error: charmsError } = await supabase
    .from('users')
    .select('id, username, email')
    .or(`username.eq.${testUsername},email.eq.${testUsername}@getflash.io`)
    .single();

  if (charmsError) {
    console.error('Error finding user:', charmsError);
  } else {
    console.log('Found user:', charmsUser);
  }

  // Test 3: Count deals for specific user
  if (charmsUser) {
    console.log(`\n3. Counting deals for user '${testUsername}' (ID: ${charmsUser.id}):`);
    
    const { count: totalDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });
    
    const { count: userDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', charmsUser.id);
    
    console.log(`  - Total deals in database: ${totalDeals}`);
    console.log(`  - Deals owned by ${testUsername}: ${userDeals}`);
  }

  // Test 4: Check how usernames are stored
  console.log('\n4. Sample of usernames in the database:');
  const { data: sampleUsers } = await supabase
    .from('users')
    .select('username, email')
    .limit(20);
  
  const uniqueUsernames = new Set(sampleUsers?.map(u => u.username).filter(Boolean));
  console.log('Unique usernames:', Array.from(uniqueUsernames).sort());

  // Test 5: Check deals with owners
  console.log('\n5. Sample deals with owner information:');
  const { data: sampleDeals } = await supabase
    .from('deals')
    .select(`
      id,
      organization:organizations!organization_id(name),
      owner:users!owner_id(username, email)
    `)
    .not('owner_id', 'is', null)
    .limit(10);
  
  sampleDeals?.forEach(deal => {
    console.log(`  - Deal ${deal.id}: ${deal.organization?.name} → Owner: ${deal.owner?.username || deal.owner?.email}`);
  });

  // Test 6: Check for case sensitivity issues
  console.log('\n6. Testing case sensitivity:');
  const testCases = ['charms', 'Charms', 'CHARMS'];
  for (const testCase of testCases) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', testCase)
      .single();
    
    console.log(`  - Username '${testCase}': ${data ? 'Found' : 'Not found'}`);
  }
}

testUsernameFiltering().catch(console.error);