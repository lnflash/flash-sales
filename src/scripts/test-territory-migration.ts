#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

async function testTerritoryMigration() {
  console.log('🌴 Testing Caribbean Territory Migration...\n');

  try {
    // Test 1: Check countries table
    console.log('1️⃣ Checking countries...');
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('*')
      .order('name');

    if (countriesError) throw countriesError;

    console.log(`✅ Found ${countries.length} countries:`);
    countries.forEach(country => {
      console.log(`   ${country.flag_emoji} ${country.name} (${country.code}) - ${country.currency_code}`);
    });
    console.log('');

    // Test 2: Check territories
    console.log('2️⃣ Checking territories by country...');
    for (const country of countries) {
      const { data: territories, error: territoriesError } = await supabase
        .from('territories')
        .select('*')
        .eq('country_id', country.id)
        .order('level')
        .order('name');

      if (territoriesError) throw territoriesError;

      console.log(`\n${country.flag_emoji} ${country.name}:`);
      const byLevel = territories.reduce((acc, t) => {
        if (!acc[t.level]) acc[t.level] = [];
        acc[t.level].push(t);
        return acc;
      }, {} as Record<number, any[]>);

      Object.entries(byLevel).forEach(([level, terrs]) => {
        console.log(`   Level ${level} (${terrs[0].type}):`);
        terrs.forEach(t => {
          console.log(`   - ${t.name}${t.code ? ` (${t.code})` : ''}`);
        });
      });
    }

    // Test 3: Check territory hierarchy view
    console.log('\n3️⃣ Testing territory hierarchy view...');
    const { data: hierarchy, error: hierarchyError } = await supabase
      .from('territory_hierarchy')
      .select('*')
      .in('country_code', ['KY', 'CW'])
      .limit(5);

    if (hierarchyError) throw hierarchyError;

    console.log('\nSample hierarchy paths:');
    hierarchy.forEach(h => {
      console.log(`   ${h.flag_emoji} ${h.full_path}`);
    });

    // Test 4: Test territory stats function
    console.log('\n4️⃣ Testing territory stats function...');
    
    // Get a sample territory ID
    const { data: sampleTerritory } = await supabase
      .from('territories')
      .select('id, name')
      .eq('name', 'Kingston')
      .single();

    if (sampleTerritory) {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_territory_stats', { p_territory_id: sampleTerritory.id });

      if (statsError) {
        console.log('   ⚠️  Stats function not yet available (expected before data exists)');
      } else {
        console.log(`   📊 Stats for ${sampleTerritory.name}:`, stats[0]);
      }
    }

    // Test 5: Check if existing Jamaica data can be migrated
    console.log('\n5️⃣ Checking Jamaica data migration readiness...');
    const { data: jamaicaDeals, error: dealsError } = await supabase
      .from('deals')
      .select('id, territory, organization')
      .is('territory_id', null)
      .not('territory', 'is', null)
      .limit(5);

    if (dealsError) throw dealsError;

    if (jamaicaDeals && jamaicaDeals.length > 0) {
      console.log(`   🔄 Found ${jamaicaDeals.length} deals ready for territory migration`);
      console.log('   Sample deals to migrate:');
      jamaicaDeals.forEach(deal => {
        console.log(`   - ${deal.territory || deal.organization?.state_province || 'Unknown'}`);
      });
    } else {
      console.log('   ✅ No unmigrated deals found');
    }

    console.log('\n✅ Territory migration test completed successfully!');

  } catch (error) {
    console.error('\n❌ Error testing migration:', error);
    process.exit(1);
  }
}

// Run the test
testTerritoryMigration();