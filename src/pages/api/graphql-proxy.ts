import type { NextApiRequest, NextApiResponse } from 'next';

const GRAPHQL_URI = process.env.NEXT_PUBLIC_GRAPHQL_URI || 'https://api.flashapp.me/graphql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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