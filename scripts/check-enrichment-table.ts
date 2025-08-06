import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEnrichmentCache() {
  console.log('Checking enrichment_cache table...\n');
  
  // Try to query the table
  const { data, error } = await supabase
    .from('enrichment_cache')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error querying enrichment_cache:', error);
    console.log('\nError details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
  } else {
    console.log('Successfully queried enrichment_cache table');
    console.log('Sample data:', data);
  }
  
  // Try the exact query that's failing
  console.log('\nTrying the exact failing query...');
  const { data: data2, error: error2 } = await supabase
    .from('enrichment_cache')
    .select('data,timestamp')
    .eq('type', 'company')
    .eq('key', 'Test-Kingston')
    .maybeSingle();
    
  if (error2) {
    console.error('Error with company query:', error2);
    console.log('\nError details:', {
      code: error2.code,
      message: error2.message,
      details: error2.details,
      hint: error2.hint
    });
  } else {
    console.log('Successfully executed company query');
    console.log('Result:', data2);
  }
  
  // Check if we can insert
  console.log('\nTrying to insert a test record...');
  const testData = {
    type: 'company',
    key: 'Test-Company-Kingston',
    data: { test: true, name: 'Test Company' },
    timestamp: new Date().toISOString()
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('enrichment_cache')
    .insert(testData)
    .select()
    .single();
    
  if (insertError) {
    console.error('Error inserting:', insertError);
    console.log('\nInsert error details:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
  } else {
    console.log('Successfully inserted test record:', insertData);
    
    // Try to delete it
    const { error: deleteError } = await supabase
      .from('enrichment_cache')
      .delete()
      .eq('key', 'Test-Company-Kingston');
      
    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
    } else {
      console.log('Successfully cleaned up test record');
    }
  }
}

checkEnrichmentCache().catch(console.error);