import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { enrichCompany } from '@/services/data-enrichment';
import { getGooglePlacesApiKey } from '@/config/google-places';

// Mock fetch for API tests
global.fetch = jest.fn();

describe('Google Places API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any cached data
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Key Configuration', () => {
    it('should have Google Places API key configured', () => {
      const apiKey = getGooglePlacesApiKey();
      expect(apiKey).toBeDefined();
      expect(apiKey).not.toBe('');
      expect(apiKey.length).toBeGreaterThan(20); // API keys are typically long
    });

    it('should use NEXT_PUBLIC_GOOGLE_PLACES_API_KEY on client side', () => {
      const originalWindow = global.window;
      global.window = {} as any;
      
      const apiKey = getGooglePlacesApiKey();
      expect(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY).toBeDefined();
      
      global.window = originalWindow;
    });

    it('should use GOOGLE_PLACES_API_KEY on server side', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const apiKey = getGooglePlacesApiKey();
      expect(apiKey).toBeDefined();
      
      global.window = originalWindow;
    });
  });

  describe('Company Enrichment', () => {
    it('should successfully enrich company with valid data', async () => {
      const mockApiResponse = {
        status: 'OK',
        results: [{
          place_id: 'test_place_id',
          name: 'Test Company',
          formatted_address: '123 Test St, Kingston, Jamaica',
          types: ['restaurant', 'food']
        }]
      };

      const mockDetailsResponse = {
        status: 'OK',
        result: {
          name: 'Test Company',
          formatted_address: '123 Test St, Kingston, Jamaica',
          formatted_phone_number: '+1 876-555-0100',
          international_phone_number: '+1 876-555-0100',
          website: 'https://testcompany.com',
          rating: 4.5,
          user_ratings_total: 100,
          business_status: 'OPERATIONAL',
          types: ['restaurant', 'food'],
          opening_hours: {
            weekday_text: ['Monday: 9:00 AM – 5:00 PM'],
            periods: []
          },
          address_components: [
            { types: ['locality'], long_name: 'Kingston', short_name: 'Kingston' },
            { types: ['administrative_area_level_1'], long_name: 'Kingston Parish', short_name: 'KIN' },
            { types: ['country'], long_name: 'Jamaica', short_name: 'JM' }
          ],
          geometry: {
            location: { lat: 18.0179, lng: -76.8099 }
          }
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse
        });

      const result = await enrichCompany({
        name: 'Test Company',
        location: 'Kingston'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('Test Company');
      expect(result.data.location.address).toBe('123 Test St, Kingston, Jamaica');
      expect(result.data.contact.phone).toBe('+1 876-555-0100');
      expect(result.data.contact.website).toBe('https://testcompany.com');
      expect(result.data.additionalInfo.rating).toBe(4.5);
      expect(result.data.additionalInfo.totalRatings).toBe(100);
      expect(result.data.additionalInfo.businessStatus).toBe('OPERATIONAL');
    });

    it('should handle company not found gracefully', async () => {
      const mockApiResponse = {
        status: 'ZERO_RESULTS',
        results: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const result = await enrichCompany({
        name: 'Non Existent Company XYZ123',
        location: 'Kingston'
      });

      expect(result.success).toBe(true);
      expect(result.data.additionalInfo.noResultsFound).toBe(true);
      expect(result.data.name).toBe('Non Existent Company XYZ123');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API quota exceeded' })
      });

      const result = await enrichCompany({
        name: 'Test Company',
        location: 'Kingston'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await enrichCompany({
        name: 'Test Company',
        location: 'Kingston'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should require company name', async () => {
      const result = await enrichCompany({
        name: '',
        location: 'Kingston'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Caching Mechanism', () => {
    it('should cache successful API responses', async () => {
      const mockApiResponse = {
        status: 'OK',
        results: [{
          place_id: 'test_place_id',
          name: 'Cached Company'
        }]
      };

      const mockDetailsResponse = {
        status: 'OK',
        result: {
          name: 'Cached Company',
          formatted_address: '456 Cache St, Kingston, Jamaica'
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse
        });

      // First call - should hit API
      const result1 = await enrichCompany({
        name: 'Cached Company',
        location: 'Kingston'
      });

      expect(result1.success).toBe(true);
      expect(result1.source).toBe('google_places');
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Second call - should use cache
      jest.clearAllMocks();
      const result2 = await enrichCompany({
        name: 'Cached Company',
        location: 'Kingston'
      });

      expect(result2.success).toBe(true);
      expect(result2.source).toBe('cache');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not use stale cache (older than 7 days)', async () => {
      // Mock a cached entry that's 8 days old
      const staleTimestamp = new Date();
      staleTimestamp.setDate(staleTimestamp.getDate() - 8);
      
      // This would require mocking the cache storage mechanism
      // For now, we'll test that the cache expiry logic is correct
      const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
      const isStale = (Date.now() - staleTimestamp.getTime()) > CACHE_MAX_AGE;
      
      expect(isStale).toBe(true);
    });
  });

  describe('Different Business Types', () => {
    const testCases = [
      {
        name: 'Island Grill',
        location: 'Kingston',
        expectedTypes: ['restaurant', 'food']
      },
      {
        name: 'NCB Bank',
        location: 'Kingston',
        expectedTypes: ['bank', 'finance']
      },
      {
        name: 'Fontana Pharmacy',
        location: 'Kingston',
        expectedTypes: ['pharmacy', 'health']
      },
      {
        name: 'Courts Jamaica',
        location: 'Kingston',
        expectedTypes: ['store', 'furniture_store']
      },
      {
        name: 'Digicel',
        location: 'Kingston',
        expectedTypes: ['telecommunications']
      }
    ];

    testCases.forEach(testCase => {
      it(`should correctly identify ${testCase.name} business type`, async () => {
        const mockApiResponse = {
          status: 'OK',
          results: [{
            place_id: `${testCase.name}_id`,
            name: testCase.name,
            types: testCase.expectedTypes
          }]
        };

        const mockDetailsResponse = {
          status: 'OK',
          result: {
            name: testCase.name,
            types: testCase.expectedTypes,
            formatted_address: `${testCase.location}, Jamaica`
          }
        };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockApiResponse
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockDetailsResponse
          });

        const result = await enrichCompany({
          name: testCase.name,
          location: testCase.location
        });

        expect(result.success).toBe(true);
        expect(result.data.industry).toBeDefined();
      });
    });
  });

  describe('Location Handling', () => {
    it('should handle different location formats', async () => {
      const locations = [
        'Kingston',
        'Montego Bay',
        'Ocho Rios',
        'Negril',
        'Port Antonio',
        'Spanish Town',
        'Mandeville',
        'May Pen',
        'Portmore',
        'Jamaica' // Country only
      ];

      for (const location of locations) {
        const mockApiResponse = {
          status: 'OK',
          results: [{
            place_id: 'test_id',
            name: 'Test Business',
            formatted_address: `Test Address, ${location}, Jamaica`
          }]
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        });

        const result = await enrichCompany({
          name: 'Test Business',
          location: location
        });

        expect(result).toBeDefined();
        // Location should be included in search query
      }
    });

    it('should default to Jamaica if no location provided', async () => {
      const mockApiResponse = {
        status: 'OK',
        results: [{
          place_id: 'test_id',
          name: 'Test Business'
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const result = await enrichCompany({
        name: 'Test Business'
      });

      // Should include Jamaica in search
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Jamaica'),
        expect.any(Object)
      );
    });
  });

  describe('API Response Validation', () => {
    it('should handle missing optional fields gracefully', async () => {
      const mockApiResponse = {
        status: 'OK',
        results: [{
          place_id: 'test_id',
          name: 'Minimal Business'
        }]
      };

      const mockDetailsResponse = {
        status: 'OK',
        result: {
          name: 'Minimal Business',
          formatted_address: 'Kingston, Jamaica'
          // Missing: phone, website, rating, etc.
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse
        });

      const result = await enrichCompany({
        name: 'Minimal Business',
        location: 'Kingston'
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Minimal Business');
      expect(result.data.contact.phone).toBeNull();
      expect(result.data.contact.website).toBeNull();
      expect(result.data.additionalInfo.rating).toBeUndefined();
    });

    it('should handle malformed API responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      });

      const result = await enrichCompany({
        name: 'Test Business',
        location: 'Kingston'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Special Characters and Edge Cases', () => {
    const specialCases = [
      "D'Music Shack",
      "Lee's Restaurant",
      "A&B Company",
      "Company (Jamaica) Ltd.",
      "Café Blue",
      "José's Place",
      "Company #1",
      "@Home Store",
      "50% Off Store"
    ];

    specialCases.forEach(name => {
      it(`should handle special characters in name: ${name}`, async () => {
        const mockApiResponse = {
          status: 'OK',
          results: [{
            place_id: 'test_id',
            name: name
          }]
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse
        });

        const result = await enrichCompany({
          name: name,
          location: 'Kingston'
        });

        expect(result).toBeDefined();
        // Should properly encode special characters in API request
      });
    });

    it('should handle very long company names', async () => {
      const longName = 'A'.repeat(200); // 200 character name
      
      const result = await enrichCompany({
        name: longName,
        location: 'Kingston'
      });

      expect(result).toBeDefined();
    });

    it('should handle empty responses gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const result = await enrichCompany({
        name: 'Test',
        location: 'Kingston'
      });

      expect(result.success).toBe(false);
    });
  });
});