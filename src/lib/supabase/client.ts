import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getSupabaseConfig } from './runtime-config';

// Create a dummy client for build time when env vars are not available
const createSupabaseClient = () => {
  const { url: finalUrl, key: finalKey } = getSupabaseConfig();
  
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
          }),
          limit: () => Promise.resolve({ data: null, error: { message: 'placeholder client' } })
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
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    },
    db: {
      schema: 'public'
    }
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
    const instance = getSupabase();
    return instance[prop as keyof typeof instance];
  }
});

// Alias for getSupabase - used in newer code
export const getSupabaseClient = getSupabase;