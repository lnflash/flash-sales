import type { NextApiRequest, NextApiResponse } from 'next';
import { RepWeeklyData, RepTrackingFormData } from '../../../types/rep-tracking';

// In-memory storage for demo purposes
// In production, this would be stored in a database
let repTrackingData: RepWeeklyData[] = [];

// Export for use in stats endpoint
export { repTrackingData };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Get all rep tracking data with optional filters
    const { repName, startDate, endDate } = req.query;
    
    let filteredData = [...repTrackingData];
    
    if (repName) {
      filteredData = filteredData.filter(data => 
        data.repName.toLowerCase().includes((repName as string).toLowerCase())
      );
    }
    
    if (startDate) {
      filteredData = filteredData.filter(data => 
        data.weekStartDate >= (startDate as string)
      );
    }
    
    if (endDate) {
      filteredData = filteredData.filter(data => 
        data.weekStartDate <= (endDate as string)
      );
    }
    
    // Sort by date descending
    filteredData.sort((a, b) => 
      new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
    );
    
    res.status(200).json(filteredData);
  } else if (req.method === 'POST') {
    // Create new rep tracking entry
    const formData: RepTrackingFormData = req.body;
    
    // Check if entry already exists for this rep and week
    const existingIndex = repTrackingData.findIndex(
      data => data.repName === formData.repName && 
              data.weekStartDate === formData.weekStartDate
    );
    
    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
      // Update existing entry
      repTrackingData[existingIndex] = {
        ...repTrackingData[existingIndex],
        ...formData,
        updatedAt: now
      };
      res.status(200).json(repTrackingData[existingIndex]);
    } else {
      // Create new entry
      const newEntry: RepWeeklyData = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        createdAt: now,
        updatedAt: now
      };
      repTrackingData.push(newEntry);
      res.status(201).json(newEntry);
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}