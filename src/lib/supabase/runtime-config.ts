// Runtime configuration helper for Supabase
// This helps avoid hydration mismatches by ensuring consistent behavior between server and client

let cachedUrl: string = '';
let cachedKey: string = '';
let configFetched = false;

export function getSupabaseEnvVars(): { url: string; key: string } {
  // Return cached values if available and not empty
  if (cachedUrl && cachedKey) {
    return { url: cachedUrl, key: cachedKey };
  }

  // Server-side: use process.env directly
  if (typeof window === 'undefined') {
    cachedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    cachedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return { url: cachedUrl, key: cachedKey };
  }

  // Client-side: check multiple sources
  // First check if values were injected by _document.tsx
  if ((window as any).NEXT_PUBLIC_SUPABASE_URL && (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    cachedUrl = (window as any).NEXT_PUBLIC_SUPABASE_URL || '';
    cachedKey = (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return { url: cachedUrl, key: cachedKey };
  }

  // Check process.env
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    cachedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    cachedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return { url: cachedUrl, key: cachedKey };
  }
  
  // Return empty strings if nothing found
  return { url: '', key: '' };
}

// Async function to fetch config from API
export async function fetchRuntimeConfig() {
  if (configFetched || typeof window === 'undefined') return;
  
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      if (config.supabase.url && config.supabase.anonKey) {
        cachedUrl = config.supabase.url;
        cachedKey = config.supabase.anonKey;
        // Also set on window for other uses
        (window as any).NEXT_PUBLIC_SUPABASE_URL = config.supabase.url;
        (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY = config.supabase.anonKey;
        (window as any).NEXT_PUBLIC_USE_SUPABASE = config.supabase.isEnabled;
      }
    }
  } catch (error) {
    console.error('Failed to fetch runtime config:', error);
  } finally {
    configFetched = true;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnvVars();
  return !!(url && key);
}