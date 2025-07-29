import type { NextApiRequest, NextApiResponse } from 'next';

// This endpoint provides runtime configuration to the client
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return public environment variables
  res.status(200).json({
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      isEnabled: process.env.NEXT_PUBLIC_USE_SUPABASE === 'true',
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || '',
      env: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    },
    graphql: {
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'https://api.flashapp.me/graphql',
    }
  });
}