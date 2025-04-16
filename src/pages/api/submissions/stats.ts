import type { NextApiRequest, NextApiResponse } from 'next';

// The target API endpoint
const TARGET_API_URL = process.env.INTAKE_API_URL || 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Log the request
    console.log(`Proxying request to: ${TARGET_API_URL}/submissions/stats`);
    
    // Full URL for debugging
    const fullUrl = `${TARGET_API_URL}/submissions/stats`;
    console.log(`Full URL: ${fullUrl}`);
    
    // Forward the request to the intake form API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Response status: ${response.status}`);
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error in stats proxy:', error);
    if (error.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}