import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ...params } = req.body;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
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

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error('Google Places API error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}