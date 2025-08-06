// Google Places API configuration
export const getGooglePlacesApiKey = (): string => {
  // Try different ways to get the API key
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';
  } else {
    // Server-side
    return process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';
  }
};

export const GOOGLE_PLACES_CONFIG = {
  baseUrl: 'https://maps.googleapis.com/maps/api/place',
  defaultRegion: 'jm', // Jamaica
  defaultLanguage: 'en',
  cacheMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};