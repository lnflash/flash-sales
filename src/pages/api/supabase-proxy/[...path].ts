import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseServiceKey) {
  console.error('Warning: No Supabase service key found, using anon key');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Extract the path from the catch-all route
    const { path } = req.query;
    const tableName = Array.isArray(path) ? path[0] : path;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST': {
        const { data, error } = await supabase.from(tableName).insert(req.body).select();
        if (error) throw error;
        return res.status(201).json(data);
      }

      case 'PATCH':
      case 'PUT': {
        // Extract ID from query parameters
        const id = req.query.id as string;
        if (!id) {
          return res.status(400).json({ error: 'ID is required for update operations' });
        }

        const { data, error } = await supabase
          .from(tableName)
          .update(req.body)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'DELETE': {
        const id = req.query.id as string;
        if (!id) {
          return res.status(400).json({ error: 'ID is required for delete operations' });
        }

        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        return res.status(204).end();
      }

      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Supabase proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}