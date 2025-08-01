import { supabase } from '@/lib/supabase/client';

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
  };
  description?: string;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
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

// Mock enrichment service - in production, replace with real APIs
// like Clearbit, Hunter.io, Apollo.io, etc.
class DataEnrichmentService {
  // Enrich company data based on domain or name
  async enrichCompany(query: { domain?: string; name?: string }): Promise<EnrichmentResult> {
    try {
      // In production, you would call external APIs here
      // For now, we'll use mock data and patterns
      
      if (!query.domain && !query.name) {
        throw new Error('Either domain or company name is required');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock enrichment based on patterns
      const mockData = this.generateMockCompanyData(query);
      
      // Store enrichment result in database for caching
      if (query.domain) {
        await this.cacheEnrichmentResult('company', query.domain, mockData);
      }

      return {
        success: true,
        data: mockData,
        source: 'mock',
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock enrichment
      const mockData = this.generateMockPersonData(email);
      
      // Cache result
      await this.cacheEnrichmentResult('person', email, mockData);

      return {
        success: true,
        data: mockData,
        source: 'mock',
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
      // In production, use services like Twilio Lookup API
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockData = {
        number: phone,
        type: Math.random() > 0.7 ? 'mobile' : 'landline',
        carrier: this.generateMockCarrier(),
        location: this.generateMockPhoneLocation()
      };

      return {
        success: true,
        data: mockData,
        source: 'mock',
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

  // Validate and standardize address
  async enrichAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<EnrichmentResult> {
    try {
      // In production, use services like Google Maps API, USPS API, etc.
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockData = {
        standardized: {
          street: this.standardizeStreet(address.street),
          city: this.properCase(address.city),
          state: address.state.toUpperCase(),
          zip: address.zip,
          zipPlus4: address.zip + '-' + Math.floor(Math.random() * 9000 + 1000),
          country: 'US'
        },
        coordinates: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.1,
          lng: -122.4194 + (Math.random() - 0.5) * 0.1
        },
        timezone: 'America/Los_Angeles',
        county: 'San Francisco County'
      };

      return {
        success: true,
        data: mockData,
        source: 'mock',
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

  // Private helper methods
  private generateMockCompanyData(query: { domain?: string; name?: string }): CompanyEnrichment {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Services'];
    const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
    
    return {
      name: query.name || this.domainToCompanyName(query.domain || ''),
      domain: query.domain,
      industry: industries[Math.floor(Math.random() * industries.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      revenue: '$' + Math.floor(Math.random() * 100 + 1) + 'M',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'US'
      },
      description: `Leading ${industries[0].toLowerCase()} company focused on innovative solutions.`,
      socialProfiles: {
        linkedin: `https://linkedin.com/company/${query.domain?.replace('.com', '')}`,
        twitter: `https://twitter.com/${query.domain?.replace('.com', '')}`
      }
    };
  }

  private generateMockPersonData(email: string): PersonEnrichment {
    const [localPart, domain] = email.split('@');
    const titles = ['CEO', 'CTO', 'VP Sales', 'Marketing Director', 'Product Manager', 'Engineer'];
    
    return {
      name: this.emailToName(localPart),
      email: email,
      title: titles[Math.floor(Math.random() * titles.length)],
      company: this.domainToCompanyName(domain),
      location: 'San Francisco, CA',
      socialProfiles: {
        linkedin: `https://linkedin.com/in/${localPart}`,
        twitter: `https://twitter.com/${localPart}`
      }
    };
  }

  private generateMockCarrier(): string {
    const carriers = ['Verizon', 'AT&T', 'T-Mobile', 'Sprint', 'US Cellular'];
    return carriers[Math.floor(Math.random() * carriers.length)];
  }

  private generateMockPhoneLocation(): string {
    const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  private domainToCompanyName(domain: string): string {
    return domain
      .replace(/\.(com|org|net|io|co)$/, '')
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
      const { error } = await supabase
        .from('enrichment_cache')
        .upsert({
          type,
          key,
          data,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        console.error('Cache storage error:', error);
      }
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  private async getCachedEnrichment(type: string, key: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('enrichment_cache')
        .select('data, timestamp')
        .eq('type', type)
        .eq('key', key)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  private isCacheValid(timestamp: string, maxAgeHours: number = 24 * 7): boolean {
    const cacheTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    return (now - cacheTime) < maxAge;
  }
}

// Export singleton instance
export const dataEnrichmentService = new DataEnrichmentService();

// Export convenience functions
export const enrichCompany = (query: { domain?: string; name?: string }) => 
  dataEnrichmentService.enrichCompany(query);

export const enrichPerson = (email: string) => 
  dataEnrichmentService.enrichPerson(email);

export const enrichPhoneNumber = (phone: string) => 
  dataEnrichmentService.enrichPhoneNumber(phone);

export const enrichAddress = (address: { street: string; city: string; state: string; zip: string }) => 
  dataEnrichmentService.enrichAddress(address);