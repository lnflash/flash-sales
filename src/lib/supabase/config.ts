// Runtime configuration for Supabase
export function getSupabaseConfig() {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    // Server-side: use process.env
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      isConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    };
  }

  // Client-side: check window object first (injected by _document.tsx)
  const url = (window as any).NEXT_PUBLIC_SUPABASE_URL || 
               process.env.NEXT_PUBLIC_SUPABASE_URL || 
               '';
               
  const anonKey = (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || 
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