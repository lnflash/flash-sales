import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint is deprecated - the app now uses Supabase directly
  return res.status(410).json({
    error: 'This endpoint has been deprecated. The application now uses Supabase for all data operations.',
    message: 'Please update your code to use the Supabase client directly.'
  });
}