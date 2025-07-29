// Runtime configuration helper for Supabase
// This helps avoid hydration mismatches by ensuring consistent behavior between server and client

// Fallback configuration for when environment variables are not available
const FALLBACK_CONFIG = {
  url: 'https://pgsxczfkjbtgzcauxuur.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU'
};

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
  
  // Return fallback config if nothing found
  return { url: FALLBACK_CONFIG.url, key: FALLBACK_CONFIG.anonKey };
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

// Force use of fallback config on DigitalOcean if env vars are not working
export function getSupabaseConfig() {
  const config = getSupabaseEnvVars();
  
  // If we're on DigitalOcean and don't have proper config, use fallback
  if (typeof window !== 'undefined' && 
      window.location.hostname.includes('ondigitalocean.app') &&
      (!config.url || config.url === FALLBACK_CONFIG.url)) {
    return { url: FALLBACK_CONFIG.url, key: FALLBACK_CONFIG.anonKey };
  }
  
  return config;
}