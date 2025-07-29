import type { NextApiRequest, NextApiResponse } from 'next';

// The target API endpoint
const TARGET_API_URL = process.env.INTAKE_API_URL || 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log(`[API PROXY] Proxying ${req.method} request to: ${TARGET_API_URL}/submissions/${id}`);
    
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Include body for PUT requests
    if (req.method === 'PUT' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log(`[API PROXY] PUT body:`, req.body);
    }
    
    const response = await fetch(`${TARGET_API_URL}/submissions/${id}`, fetchOptions);
    
    console.log(`[API PROXY] Response status: ${response.status}`);
    
    // Handle DELETE requests
    if (req.method === 'DELETE') {
      if (response.ok) {
        // For successful DELETE, return 204 No Content
        return res.status(204).end();
      } else {
        // For failed DELETE, try to get error message
        const errorText = await response.text();
        let errorMessage = 'Failed to delete submission';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }
        return res.status(response.status).json({ message: errorMessage });
      }
    }
    
    // For GET and PUT requests, parse and return the JSON response
    const responseText = await response.text();
    console.log(`[API PROXY] Raw response: ${responseText}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[API PROXY] Failed to parse response as JSON:`, parseError);
      return res.status(500).json({
        error: 'Invalid response from API server'
      });
    }
    
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[API PROXY] Error in submission proxy:', error);
    return res.status(500).json({
      error: 'API request failed: ' + error.message
    });
  }
}