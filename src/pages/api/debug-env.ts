import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development or with a secret key
  const secret = req.query.secret;
  if (process.env.NODE_ENV === 'production' && secret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Return environment variable status (not the actual values for security)
  res.status(200).json({
    environment: process.env.NODE_ENV,
    supabase: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      isEnabled: process.env.NEXT_PUBLIC_USE_SUPABASE === 'true',
    },
    app: {
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    },
    graphql: {
      hasUri: !!process.env.NEXT_PUBLIC_GRAPHQL_URI,
    }
  });
}