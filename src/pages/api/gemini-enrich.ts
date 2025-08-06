import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companyName, existingData, territory } = req.body;

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('Google Gemini API key not configured');
    return res.status(500).json({ 
      error: 'Google Gemini API key not configured. Please set GOOGLE_GEMINI_API_KEY in your environment variables.' 
    });
  }

  try {
    // Use Gemini Pro model for text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a prompt to enrich company data
    const prompt = `
      You are a business intelligence assistant. I need additional information about the following company in Jamaica:
      
      Company Name: ${companyName}
      Territory: ${territory || 'Jamaica'}
      ${existingData ? `Existing Information: ${JSON.stringify(existingData)}` : ''}
      
      Please provide the following information if available:
      1. Industry classification and business type
      2. Estimated company size (employees)
      3. Key products or services offered
      4. Target market and customer base
      5. Competitive advantages
      6. Business challenges they might face
      7. Potential needs for Bitcoin/cryptocurrency services
      8. Decision-making structure (if known)
      9. Best approach for sales engagement
      10. Any recent news or updates about the company
      
      Format the response as a JSON object with these fields:
      {
        "industry": "string",
        "companySize": "string",
        "products": ["array of strings"],
        "targetMarket": "string",
        "competitiveAdvantages": ["array of strings"],
        "challenges": ["array of strings"],
        "cryptoNeeds": ["array of potential use cases"],
        "decisionMakers": "string",
        "salesApproach": "string",
        "recentNews": "string or null",
        "additionalNotes": "string"
      }
      
      If you don't have specific information about this company, provide intelligent estimates based on the industry and location.
      Only return the JSON object, no additional text.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    let enrichedData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enrichedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Return a structured response even if parsing fails
      enrichedData = {
        industry: existingData?.industry || 'Unknown',
        rawResponse: text,
        error: 'Could not parse structured data',
        additionalNotes: text.substring(0, 500)
      };
    }

    res.status(200).json({
      success: true,
      data: enrichedData,
      source: 'gemini',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enrich data with Gemini',
      timestamp: new Date().toISOString()
    });
  }
}