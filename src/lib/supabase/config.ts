import { getSupabaseEnvVars, isSupabaseConfigured } from './runtime-config';

// Runtime configuration for Supabase
export function getSupabaseConfig() {
  const { url, key } = getSupabaseEnvVars();
  
  // Only log in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Supabase config:', { 
      hasUrl: !!url, 
      hasKey: !!key,
      urlLength: url.length,
      keyLength: key.length 
    });
  }

  return {
    url,
    anonKey: key,
    isConfigured: isSupabaseConfigured()
  };
}