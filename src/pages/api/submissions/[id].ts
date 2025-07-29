import type { NextApiRequest, NextApiResponse } from 'next';

// The target API endpoint
const TARGET_API_URL = process.env.INTAKE_API_URL || 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { id } = req.query;
    
    // Log the request
    console.log(`Proxying request to: ${TARGET_API_URL}/submissions/${id}`);
    
    // Full URL for debugging
    const fullUrl = `${TARGET_API_URL}/submissions/${id}`;
    console.log(`Full URL: ${fullUrl}`);
    
    // Forward the request to the intake form API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    let fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    };
    
    // Include body for PUT requests
    if (req.method === 'PUT' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    // DELETE method doesn't need body
    
    const response = await fetch(fullUrl, fetchOptions);
    
    clearTimeout(timeoutId);
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Submission not found' });
    }
    
    // For DELETE requests, we might not get a response body
    if (req.method === 'DELETE') {
      // Check if there's a response body
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      if (contentLength === '0' || !contentType?.includes('application/json')) {
        // No content or not JSON, just return success
        return res.status(204).end();
      }
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in submission detail proxy:', error);
    if (error.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}