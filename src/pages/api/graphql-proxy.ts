import type { NextApiRequest, NextApiResponse } from 'next';

// Note: This proxy is kept for authentication purposes only
// All submission data now comes from Supabase
const GRAPHQL_URI = process.env.NEXT_PUBLIC_GRAPHQL_URI;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GRAPHQL_URI) {
    return res.status(503).json({ 
      error: 'GraphQL endpoint not configured',
      message: 'The NEXT_PUBLIC_GRAPHQL_URI environment variable is not set. Note: All submission data now comes from Supabase.'
    });
  }

  console.log('GraphQL proxy request:', {
    uri: GRAPHQL_URI,
    body: req.body
  });

  try {
    // Forward the request to the actual GraphQL endpoint
    const response = await fetch(GRAPHQL_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any auth headers if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        // Forward IP headers for the GraphQL server
        ...(req.headers['x-real-ip'] && { 'x-real-ip': req.headers['x-real-ip'] as string }),
        ...(req.headers['x-forwarded-for'] && { 'x-forwarded-for': req.headers['x-forwarded-for'] as string }),
      },
      body: JSON.stringify(req.body),
    });

    // Get the response data
    const data = await response.json();

    // Forward the response status and data
    res.status(response.status).json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to GraphQL server',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}