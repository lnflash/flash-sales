// Runtime configuration helper for Supabase
// This helps avoid hydration mismatches by ensuring consistent behavior between server and client

let cachedUrl: string | null = null;
let cachedKey: string | null = null;

export function getSupabaseEnvVars() {
  // Return cached values if available
  if (cachedUrl !== null && cachedKey !== null) {
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
    cachedUrl = (window as any).NEXT_PUBLIC_SUPABASE_URL;
    cachedKey = (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return { url: cachedUrl, key: cachedKey };
  }

  // Fallback to process.env (for local development)
  cachedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  cachedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return { url: cachedUrl, key: cachedKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnvVars();
  return !!(url && key);
}