import { supabase } from '@/lib/supabase/client';
import { getGooglePlacesApiKey, GOOGLE_PLACES_CONFIG } from '@/config/google-places';

// Data enrichment service for automated API lookups
export interface EnrichmentResult {
  success: boolean;
  data?: any;
  source?: string;
  error?: string;
  timestamp: string;
}

export interface CompanyEnrichment {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  description?: string;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  phone?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  businessStatus?: string;
  types?: string[];
  openingHours?: string[];
  placeId?: string;
}

export interface PersonEnrichment {
  name: string;
  email?: string;
  title?: string;
  company?: string;
  location?: string;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
  };
}

// Google Places API types
interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  opening_hours?: {
    weekday_text?: string[];
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

class DataEnrichmentService {
  private googlePlacesBaseUrl = GOOGLE_PLACES_CONFIG.baseUrl;

  // Lazy load API key to ensure environment variables are available
  private getApiKey(): string {
    return getGooglePlacesApiKey();
  }

  // Enrich company data using Google Places API
  async enrichCompany(query: { domain?: string; name?: string; location?: string }): Promise<EnrichmentResult> {
    try {
      if (!query.name) {
        throw new Error('Company name is required for enrichment');
      }

      // Check cache first
      const cacheKey = `${query.name}-${query.location || 'jamaica'}`;
      const cached = await this.getCachedEnrichment('company', cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return {
          success: true,
          data: cached.data,
          source: 'cache',
          timestamp: cached.timestamp
        };
      }

      // Get API key
      const apiKey = this.getApiKey();
      
      // If no API key, return error
      if (!apiKey) {
        return {
          success: false,
          error: 'Google Places API key not configured. Please add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your environment variables.',
          timestamp: new Date().toISOString()
        };
      }
      
      // Search for the place using Google Places Text Search
      const searchQuery = `${query.name} ${query.location || 'Jamaica'}`;
      
      let searchData: any;
      
      // Use API route in browser, direct API call in Node.js
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/google-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search', query: searchQuery })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Google Places API error:', errorData);
          throw new Error(errorData.error || 'Failed to search Google Places');
        }
        
        searchData = await response.json();
      } else {
        const searchUrl = `${this.googlePlacesBaseUrl}/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
        const searchResponse = await fetch(searchUrl);
        searchData = await searchResponse.json();
      }
      
      console.log('Google Places search results:', {
        query: searchQuery,
        status: searchData.status,
        resultsCount: searchData.results?.length || 0
      });

      if (searchData.status === 'ZERO_RESULTS' || !searchData.results?.length) {
        // Return empty result instead of throwing error
        return {
          success: true,
          data: {
            name: query.name,
            domain: null,
            industry: null,
            location: {
              address: query.location || 'Jamaica',
              city: null,
              state: null,
              country: 'JM',
              coordinates: null
            },
            contact: {
              phone: null,
              email: null,
              website: null
            },
            socialProfiles: {},
            additionalInfo: {
              noResultsFound: true,
              searchQuery
            }
          },
          source: 'google_places',
          timestamp: new Date().toISOString()
        };
      }
      
      if (searchData.status !== 'OK') {
        console.error('Google Places API error status:', searchData.status, searchData.error_message);
        throw new Error(`Google Places API error: ${searchData.status} - ${searchData.error_message || 'Unknown error'}`);
      }

      // Get the first result's place_id for detailed information
      const placeId = searchData.results[0].place_id;
      
      // Get detailed place information
      let detailsData: any;
      
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/google-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'details', 
            placeId,
            fields: 'name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,business_status,types,opening_hours,geometry,address_components'
          })
        });
        detailsData = await response.json();
      } else {
        const detailsUrl = `${this.googlePlacesBaseUrl}/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,business_status,types,opening_hours,geometry,address_components&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        detailsData = await detailsResponse.json();
      }

      if (detailsData.status !== 'OK' || !detailsData.result) {
        throw new Error('Failed to get place details');
      }

      const place: GooglePlaceResult = detailsData.result;
      
      // Parse the enriched data
      const enrichedData = this.parseGooglePlaceData(place, query);
      
      // Cache the result
      await this.cacheEnrichmentResult('company', cacheKey, enrichedData);

      return {
        success: true,
        data: enrichedData,
        source: 'google_places',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Company enrichment error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Parse Google Place data into our format
  private parseGooglePlaceData(place: GooglePlaceResult, originalQuery: { domain?: string; name?: string }): CompanyEnrichment {
    // Extract location components
    let city = '';
    let state = '';
    let country = '';
    
    if (place.address_components) {
      for (const component of place.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
        if (component.types.includes('country')) {
          country = component.short_name;
        }
      }
    }

    // Map Google place types to industries
    const industryMapping = this.mapTypesToIndustry(place.types || []);

    return {
      name: place.name,
      domain: originalQuery.domain,
      industry: industryMapping,
      location: {
        address: place.formatted_address,
        city,
        state,
        country,
        coordinates: place.geometry?.location ? {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        } : undefined
      },
      phone: place.formatted_phone_number || place.international_phone_number,
      website: place.website,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      businessStatus: place.business_status,
      types: place.types,
      openingHours: place.opening_hours?.weekday_text,
      placeId: place.place_id,
      description: `${industryMapping} business in ${city || 'Jamaica'}`
    };
  }

  // Map Google place types to industry categories
  private mapTypesToIndustry(types: string[]): string {
    const industryMap: Record<string, string> = {
      'restaurant': 'Food & Beverage',
      'food': 'Food & Beverage',
      'cafe': 'Food & Beverage',
      'bar': 'Food & Beverage',
      'store': 'Retail',
      'shopping_mall': 'Retail',
      'clothing_store': 'Retail',
      'electronics_store': 'Retail',
      'bank': 'Finance',
      'atm': 'Finance',
      'finance': 'Finance',
      'hotel': 'Hospitality',
      'lodging': 'Hospitality',
      'hospital': 'Healthcare',
      'doctor': 'Healthcare',
      'pharmacy': 'Healthcare',
      'health': 'Healthcare',
      'car_dealer': 'Automotive',
      'car_repair': 'Automotive',
      'car_rental': 'Automotive',
      'real_estate_agency': 'Real Estate',
      'insurance_agency': 'Insurance',
      'travel_agency': 'Travel',
      'gym': 'Fitness',
      'spa': 'Wellness',
      'beauty_salon': 'Beauty',
      'hair_care': 'Beauty',
      'school': 'Education',
      'university': 'Education'
    };

    for (const type of types) {
      if (industryMap[type]) {
        return industryMap[type];
      }
    }

    // Default based on common types
    if (types.includes('point_of_interest') || types.includes('establishment')) {
      return 'Services';
    }

    return 'Other';
  }

  // No longer use mock data - return error instead
  private getMockCompanyData(query: { domain?: string; name?: string; location?: string }): EnrichmentResult {
    return {
      success: false,
      error: 'Google Places API not available. Please check your API configuration.',
      timestamp: new Date().toISOString()
    };
  }

  // Enrich person data based on email
  async enrichPerson(email: string): Promise<EnrichmentResult> {
    try {
      // Check cache first
      const cached = await this.getCachedEnrichment('person', email);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return {
          success: true,
          data: cached.data,
          source: 'cache',
          timestamp: cached.timestamp
        };
      }

      // Person enrichment is not available without external API
      // In production, you could integrate with services like:
      // - Clearbit Person API
      // - Hunter.io
      // - Apollo.io
      // - LinkedIn API (with proper authentication)
      
      return {
        success: false,
        error: 'Person enrichment API not configured',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Person enrichment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Validate and enrich phone number with carrier info
  async enrichPhoneNumber(phone: string): Promise<EnrichmentResult> {
    try {
      // Phone enrichment is not available without external API
      // In production, use services like:
      // - Twilio Lookup API
      // - Numverify
      // - Nexmo Number Insight
      
      return {
        success: false,
        error: 'Phone enrichment API not configured',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Phone enrichment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Validate and standardize address using Google Geocoding API
  async enrichAddress(address: {
    street: string;
    city: string;
    state: string;
    zip?: string;
    country?: string;
  }): Promise<EnrichmentResult> {
    try {
      // Format address for geocoding
      const fullAddress = `${address.street}, ${address.city}, ${address.state}${address.zip ? ' ' + address.zip : ''}, ${address.country || 'Jamaica'}`;
      
      const apiKey = this.getApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Google Geocoding API key not configured',
          timestamp: new Date().toISOString()
        };
      }

      let data: any;
      
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/google-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'geocode', address: fullAddress })
        });
        data = await response.json();
      } else {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
        const response = await fetch(geocodeUrl);
        data = await response.json();
      }

      if (data.status !== 'OK' || !data.results?.length) {
        return {
          success: false,
          error: `Geocoding failed: ${data.status}`,
          timestamp: new Date().toISOString()
        };
      }

      const result = data.results[0];
      const standardized = this.parseGeocodeResult(result);

      return {
        success: true,
        data: standardized,
        source: 'google_geocoding',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Address enrichment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private parseGeocodeResult(result: any): any {
    const components = result.address_components || [];
    let street = '';
    let city = '';
    let state = '';
    let zip = '';
    let country = '';

    for (const component of components) {
      const types = component.types || [];
      if (types.includes('street_number')) {
        street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        street += component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zip = component.long_name;
      }
      if (types.includes('country')) {
        country = component.short_name;
      }
    }

    return {
      standardized: {
        street: street.trim(),
        city,
        state,
        zip,
        country,
        formatted: result.formatted_address
      },
      coordinates: {
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng
      },
      placeId: result.place_id
    };
  }

  private getMockAddressData(address: any): EnrichmentResult {
    return {
      success: false,
      error: 'Google Geocoding API not available',
      timestamp: new Date().toISOString()
    };
  }


  private domainToCompanyName(domain: string): string {
    return domain
      .replace(/\.(com|org|net|io|co|jm)$/, '')
      .split(/[-.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private emailToName(localPart: string): string {
    return localPart
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private standardizeStreet(street: string): string {
    return street
      .replace(/\bSt\b/gi, 'Street')
      .replace(/\bAve\b/gi, 'Avenue')
      .replace(/\bRd\b/gi, 'Road')
      .replace(/\bBlvd\b/gi, 'Boulevard')
      .replace(/\bLn\b/gi, 'Lane')
      .replace(/\bDr\b/gi, 'Drive')
      .replace(/\bCt\b/gi, 'Court')
      .replace(/\bPl\b/gi, 'Place');
  }

  private properCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Caching methods
  private async cacheEnrichmentResult(type: string, key: string, data: any): Promise<void> {
    try {
      // Note: enrichment_cache table would need to be created in Supabase
      // For now, we'll skip caching if the table doesn't exist
      const { error } = await supabase
        .from('enrichment_cache')
        .upsert({
          type,
          key,
          data,
          timestamp: new Date().toISOString()
        });
      
      if (error && error.code !== 'PGRST116') { // Table not found error
        console.error('Cache storage error:', error);
      }
    } catch (error) {
      // Silently fail cache operations
      console.debug('Cache storage skipped:', error);
    }
  }

  private async getCachedEnrichment(type: string, key: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('enrichment_cache')
        .select('data, timestamp')
        .eq('type', type)
        .eq('key', key)
        .maybeSingle();
      
      if (error || !data) {
        return null;
      }
      
      return data;
    } catch (error) {
      // Silently fail cache operations
      return null;
    }
  }

  private isCacheValid(timestamp: string): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    return (now - cacheTime) < GOOGLE_PLACES_CONFIG.cacheMaxAge;
  }
}

// Export singleton instance
export const dataEnrichmentService = new DataEnrichmentService();

// Export convenience functions
export const enrichCompany = (query: { domain?: string; name?: string; location?: string }) => 
  dataEnrichmentService.enrichCompany(query);

export const enrichPerson = (email: string) => 
  dataEnrichmentService.enrichPerson(email);

export const enrichPhoneNumber = (phone: string) => 
  dataEnrichmentService.enrichPhoneNumber(phone);

export const enrichAddress = (address: { street: string; city: string; state: string; zip?: string; country?: string }) => 
  dataEnrichmentService.enrichAddress(address);