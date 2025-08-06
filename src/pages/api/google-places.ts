import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ...params } = req.body;
  // Try both environment variable names
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('Google Places API key not found in environment variables');
    return res.status(500).json({ error: 'Google Places API key not configured. Please set GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in your environment variables.' });
  }

  try {
    let url: string;
    
    switch (action) {
      case 'search':
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(params.query)}&key=${apiKey}`;
        break;
        
      case 'details':
        url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${params.placeId}&fields=${params.fields}&key=${apiKey}`;
        break;
        
      case 'geocode':
        url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.address)}&key=${apiKey}`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    console.log(`Google Places API ${action} request:`, url.replace(apiKey, '***'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Google Places API ${action} response:`, {
      status: data.status,
      resultsCount: data.results?.length || 0,
      error: data.error_message
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Google Places API error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}