import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Create a dummy client for build time when env vars are not available
const createSupabaseClient = () => {
  // Try multiple sources for environment variables
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_URL) ||
    '';
    
  const supabaseAnonKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    '';
  
  // For DigitalOcean, also check __NEXT_DATA__
  if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    const nextData = (window as any).__NEXT_DATA__;
    if (nextData?.props?.pageProps) {
      const pageProps = nextData.props.pageProps;
      if (pageProps.NEXT_PUBLIC_SUPABASE_URL && !supabaseUrl) {
        (window as any).NEXT_PUBLIC_SUPABASE_URL = pageProps.NEXT_PUBLIC_SUPABASE_URL;
      }
      if (pageProps.NEXT_PUBLIC_SUPABASE_ANON_KEY && !supabaseAnonKey) {
        (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY = pageProps.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    }
  }
  
  const finalUrl = supabaseUrl || (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_URL) || '';
  const finalKey = supabaseAnonKey || (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY) || '';
  
  if (!finalUrl || !finalKey) {
    console.warn('Supabase environment variables not found. Using placeholder client.');
    // Return a placeholder client that won't throw during build
    return {
      from: () => ({ 
        select: () => ({ 
          eq: () => ({ 
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          }),
          ilike: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          }),
          or: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null })
            })
          })
        }),
        select: () => ({
          limit: () => Promise.resolve({ data: null, error: { message: 'placeholder client' } })
        })
      }),
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
      auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
    } as any;
  }
  
  return createClient<Database>(finalUrl, finalKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

// Create a singleton instance that checks env vars at runtime
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Browser client getter that creates instance on first use
export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

// Export for backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get: (target, prop) => {
    const client = getSupabase();
    return client[prop as keyof typeof client];
  }
});

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_URL) ||
    '';
    
  const supabaseAnonKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    '';
    
  return !!(supabaseUrl && supabaseAnonKey);
}

// Hook for real-time subscriptions
export function useRealtimeSubscription<T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: table as string },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}