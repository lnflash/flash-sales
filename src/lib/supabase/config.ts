import getConfig from 'next/config';

// Runtime configuration for Supabase
export function getSupabaseConfig() {
  // Try to get runtime config first
  const { publicRuntimeConfig } = getConfig() || { publicRuntimeConfig: {} };
  
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return {
      url: publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      isConfigured: false
    };
  }

  // In the browser, check multiple sources
  const url = publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_URL || 
               process.env.NEXT_PUBLIC_SUPABASE_URL || 
               '';
               
  const anonKey = publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                  '';

  console.log('Supabase config:', { 
    hasUrl: !!url, 
    hasKey: !!anonKey,
    urlLength: url.length,
    keyLength: anonKey.length 
  });

  return {
    url,
    anonKey,
    isConfigured: !!(url && anonKey)
  };
}