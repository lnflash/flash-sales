import type { NextApiRequest, NextApiResponse } from 'next';

// The target API endpoint
const TARGET_API_URL = process.env.INTAKE_API_URL || 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log(`[API PROXY] Fetching stats from: ${TARGET_API_URL}/submissions/stats`);
    
    const response = await fetch(`${TARGET_API_URL}/submissions/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`[API PROXY] Response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`[API PROXY] Raw response: ${responseText}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`[API PROXY] Parsed stats data:`, data);
    } catch (parseError) {
      console.error(`[API PROXY] Failed to parse response as JSON:`, parseError);
      return res.status(500).json({
        error: 'Invalid response from API server'
      });
    }
    
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[API PROXY] Error fetching stats:', error);
    return res.status(500).json({
      error: 'API request failed: ' + error.message
    });
  }
}