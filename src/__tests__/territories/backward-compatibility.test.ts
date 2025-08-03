import { mapDealToSubmission } from '@/lib/supabase-api';
import { JamaicaParish } from '@/types/lead-routing';

describe('Backward Compatibility', () => {
  describe('Jamaica Parish Support', () => {
    const jamaicaParishes: JamaicaParish[] = [
      'Kingston',
      'St. Andrew',
      'St. Thomas',
      'Portland',
      'St. Mary',
      'St. Ann',
      'Trelawny',
      'St. James',
      'Hanover',
      'Westmoreland',
      'St. Elizabeth',
      'Manchester',
      'Clarendon',
      'St. Catherine'
    ];

    it('maintains all Jamaica parishes in type system', () => {
      // Verify all parishes are valid
      jamaicaParishes.forEach(parish => {
        expect(typeof parish).toBe('string');
        expect(parish.length).toBeGreaterThan(0);
      });

      expect(jamaicaParishes.length).toBe(14);
    });

    it('handles legacy Jamaica deals without territory_id', () => {
      const legacyDeal = {
        id: 'legacy-1',
        name: 'Kingston Business',
        organization: {
          name: 'Kingston Business',
          state_province: 'Kingston'
        },
        owner: {
          email: 'tatiana_1@getflash.io',
          username: 'tatiana_1'
        },
        package_seen: true,
        interest_level: 4,
        created_at: '2024-01-01T10:00:00Z'
      };

      const result = mapDealToSubmission(legacyDeal);

      expect(result.territory).toBe('Kingston');
      expect(result.territoryId).toBeUndefined();
      expect(result.territoryData).toBeUndefined();
    });

    it('preserves legacy territory field when territoryData exists', () => {
      const modernDeal = {
        id: 'modern-1',
        name: 'Modern Business',
        territory_id: 'kingston-uuid',
        territory_data: {
          id: 'kingston-uuid',
          name: 'Kingston',
          type: 'parish',
          country_code: 'JM',
          country_name: 'Jamaica',
          flag_emoji: '🇯🇲',
          full_path: 'Jamaica > Kingston'
        },
        organization: {
          name: 'Modern Business',
          state_province: 'Kingston'
        },
        owner: {
          email: 'tatiana_1@getflash.io',
          username: 'tatiana_1'
        },
        package_seen: true,
        interest_level: 4,
        created_at: '2024-01-01T10:00:00Z'
      };

      const result = mapDealToSubmission(modernDeal);

      expect(result.territory).toBe('Kingston'); // Legacy field preserved
      expect(result.territoryId).toBe('kingston-uuid');
      expect(result.territoryData?.name).toBe('Kingston');
    });
  });

  describe('Legacy Email to Territory Mapping', () => {
    const emailTerritoryMap = [
      { email: 'rogimon@getflash.io', territory: 'St. Ann' },
      { email: 'tatiana_1@getflash.io', territory: 'Kingston' },
      { email: 'charms@getflash.io', territory: 'Portland' },
      { email: 'chala@getflash.io', territory: 'St. Mary' },
      { email: 'kandi@getflash.io', territory: 'St. Catherine' },
      { email: 'leah@getflash.io', territory: 'Clarendon' },
      { email: 'tamoy@getflash.io', territory: 'Manchester' },
      { email: 'jodi@getflash.io', territory: 'St. Elizabeth' },
      { email: 'flash@getflash.io', territory: 'Kingston' }
    ];

    emailTerritoryMap.forEach(({ email, territory }) => {
      it(`maps ${email} to ${territory} when no organization territory`, () => {
        const deal = {
          id: 'test-1',
          name: 'Test Business',
          owner: { email, username: email.split('@')[0] },
          organization: { name: 'Test Business', state_province: '' },
          created_at: '2024-01-01T10:00:00Z'
        };

        const result = mapDealToSubmission(deal);
        expect(result.territory).toBe(territory);
      });
    });

    it('uses organization state_province over email mapping', () => {
      const deal = {
        id: 'test-1',
        name: 'Test Business',
        owner: { 
          email: 'rogimon@getflash.io', 
          username: 'rogimon' 
        },
        organization: { 
          name: 'Test Business', 
          state_province: 'Manchester' // Different from email mapping
        },
        created_at: '2024-01-01T10:00:00Z'
      };

      const result = mapDealToSubmission(deal);
      expect(result.territory).toBe('Manchester'); // Organization takes precedence
    });
  });

  describe('Mixed Legacy and Modern Data', () => {
    it('handles array of mixed legacy and modern submissions', () => {
      const deals = [
        // Legacy Jamaica deal
        {
          id: '1',
          name: 'Legacy Jamaica',
          organization: { state_province: 'Kingston' },
          created_at: '2024-01-01T10:00:00Z'
        },
        // Modern Jamaica deal
        {
          id: '2',
          name: 'Modern Jamaica',
          territory_id: 'st-ann-uuid',
          territory_data: {
            id: 'st-ann-uuid',
            name: 'St. Ann',
            type: 'parish',
            country_code: 'JM',
            country_name: 'Jamaica',
            flag_emoji: '🇯🇲',
            full_path: 'Jamaica > St. Ann'
          },
          created_at: '2024-01-02T10:00:00Z'
        },
        // Modern Cayman deal
        {
          id: '3',
          name: 'Modern Cayman',
          territory_id: 'george-town-uuid',
          territory_data: {
            id: 'george-town-uuid',
            name: 'George Town',
            type: 'district',
            country_code: 'KY',
            country_name: 'Cayman Islands',
            flag_emoji: '🇰🇾',
            full_path: 'Cayman Islands > George Town'
          },
          created_at: '2024-01-03T10:00:00Z'
        }
      ];

      const results = deals.map(mapDealToSubmission);

      // Legacy deal
      expect(results[0].territory).toBe('Kingston');
      expect(results[0].territoryId).toBeUndefined();
      expect(results[0].territoryData).toBeUndefined();

      // Modern Jamaica deal
      expect(results[1].territory).toBe('');
      expect(results[1].territoryId).toBe('st-ann-uuid');
      expect(results[1].territoryData?.countryCode).toBe('JM');

      // Modern Cayman deal
      expect(results[2].territory).toBe('');
      expect(results[2].territoryId).toBe('george-town-uuid');
      expect(results[2].territoryData?.countryCode).toBe('KY');
    });
  });

  describe('Territory Display Logic', () => {
    it('shows correct territory name for legacy data', () => {
      const legacySubmission = {
        id: '1',
        ownerName: 'Legacy Business',
        territory: 'Kingston',
        territoryId: undefined,
        territoryData: undefined,
        packageSeen: false,
        interestLevel: 3,
        signedUp: false,
        timestamp: '2024-01-01T10:00:00Z'
      };

      // Display logic should use territory field
      const displayTerritory = legacySubmission.territoryData?.name || legacySubmission.territory;
      expect(displayTerritory).toBe('Kingston');
    });

    it('shows correct territory name for modern data', () => {
      const modernSubmission = {
        id: '2',
        ownerName: 'Modern Business',
        territory: 'Old Kingston', // Legacy field
        territoryId: 'kingston-uuid',
        territoryData: {
          id: 'kingston-uuid',
          name: 'Kingston',
          type: 'parish',
          countryCode: 'JM',
          countryName: 'Jamaica',
          flagEmoji: '🇯🇲',
          fullPath: 'Jamaica > Kingston'
        },
        packageSeen: false,
        interestLevel: 3,
        signedUp: false,
        timestamp: '2024-01-01T10:00:00Z'
      };

      // Display logic should prefer territoryData
      const displayTerritory = modernSubmission.territoryData?.name || modernSubmission.territory;
      expect(displayTerritory).toBe('Kingston');
    });
  });
});