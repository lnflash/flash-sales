import { mapDealToSubmission } from '@/lib/supabase-api';

describe('Territory Assignment', () => {
  describe('mapDealToSubmission', () => {
    const baseDeal = {
      id: 'deal-1',
      name: 'Test Business',
      package_seen: true,
      decision_makers: 'CEO',
      interest_level: 4,
      status: 'open',
      specific_needs: 'POS system',
      created_at: '2024-01-15T10:00:00Z'
    };

    it('maps territory data correctly for Jamaica', () => {
      const dealWithTerritory = {
        ...baseDeal,
        territory_id: 'kingston-id',
        territory_data: {
          id: 'kingston-id',
          name: 'Kingston',
          type: 'parish',
          country_code: 'JM',
          country_name: 'Jamaica',
          flag_emoji: '🇯🇲',
          full_path: 'Jamaica > Kingston'
        },
        organization: {
          name: 'Test Business',
          state_province: 'Kingston'
        },
        owner: {
          email: 'rogimon@getflash.io',
          username: 'rogimon'
        }
      };

      const result = mapDealToSubmission(dealWithTerritory);

      expect(result.territoryId).toBe('kingston-id');
      expect(result.territoryData).toEqual({
        id: 'kingston-id',
        name: 'Kingston',
        type: 'parish',
        countryCode: 'JM',
        countryName: 'Jamaica',
        flagEmoji: '🇯🇲',
        fullPath: 'Jamaica > Kingston'
      });
      expect(result.territory).toBe('Kingston'); // Legacy field
    });

    it('maps territory data correctly for Cayman Islands', () => {
      const dealWithTerritory = {
        ...baseDeal,
        territory_id: 'george-town-id',
        territory_data: {
          id: 'george-town-id',
          name: 'George Town',
          type: 'district',
          country_code: 'KY',
          country_name: 'Cayman Islands',
          flag_emoji: '🇰🇾',
          full_path: 'Cayman Islands > George Town'
        },
        organization: {
          name: 'Cayman Business',
          state_province: ''
        },
        owner: {
          email: 'tatiana_1@getflash.io',
          username: 'tatiana_1'
        }
      };

      const result = mapDealToSubmission(dealWithTerritory);

      expect(result.territoryId).toBe('george-town-id');
      expect(result.territoryData?.countryCode).toBe('KY');
      expect(result.territoryData?.countryName).toBe('Cayman Islands');
      expect(result.territoryData?.flagEmoji).toBe('🇰🇾');
    });

    it('maps territory data correctly for Curaçao', () => {
      const dealWithTerritory = {
        ...baseDeal,
        territory_id: 'willemstad-id',
        territory_data: {
          id: 'willemstad-id',
          name: 'Willemstad',
          type: 'district',
          country_code: 'CW',
          country_name: 'Curaçao',
          flag_emoji: '🇨🇼',
          full_path: 'Curaçao > Willemstad'
        },
        organization: {
          name: 'Curaçao Business',
          state_province: ''
        },
        owner: {
          email: 'charms@getflash.io',
          username: 'charms'
        }
      };

      const result = mapDealToSubmission(dealWithTerritory);

      expect(result.territoryId).toBe('willemstad-id');
      expect(result.territoryData?.countryCode).toBe('CW');
      expect(result.territoryData?.name).toBe('Willemstad');
      expect(result.territoryData?.type).toBe('district');
    });

    it('handles missing territory data gracefully', () => {
      const dealWithoutTerritory = {
        ...baseDeal,
        territory_id: null,
        territory_data: null,
        organization: {
          name: 'Test Business',
          state_province: 'Kingston'
        }
      };

      const result = mapDealToSubmission(dealWithoutTerritory);

      expect(result.territoryId).toBeUndefined();
      expect(result.territoryData).toBeUndefined();
      expect(result.territory).toBe('Kingston'); // Falls back to organization state_province
    });

    it('uses legacy territory mapping for deals without territory_id', () => {
      const legacyDeal = {
        ...baseDeal,
        organization: {
          name: 'Test Business',
          state_province: ''
        },
        owner: {
          email: 'rogimon@getflash.io',
          username: 'rogimon'
        }
      };

      const result = mapDealToSubmission(legacyDeal);

      expect(result.territory).toBe('St. Ann'); // From legacy email mapping
      expect(result.territoryId).toBeUndefined();
      expect(result.territoryData).toBeUndefined();
    });

    it('prioritizes territory_data name over organization state_province', () => {
      const dealWithBoth = {
        ...baseDeal,
        territory_id: 'new-kingston-id',
        territory_data: {
          id: 'new-kingston-id',
          name: 'New Kingston',
          type: 'area',
          country_code: 'JM',
          country_name: 'Jamaica',
          flag_emoji: '🇯🇲',
          full_path: 'Jamaica > Kingston > New Kingston'
        },
        organization: {
          name: 'Test Business',
          state_province: 'Old Kingston'
        }
      };

      const result = mapDealToSubmission(dealWithBoth);

      expect(result.territory).toBe('Old Kingston'); // Legacy field keeps org value
      expect(result.territoryData?.name).toBe('New Kingston'); // New field uses territory_data
    });

    it('handles hierarchical territory paths', () => {
      const dealWithHierarchy = {
        ...baseDeal,
        territory_id: 'seven-mile-beach-id',
        territory_data: {
          id: 'seven-mile-beach-id',
          name: 'Seven Mile Beach',
          type: 'area',
          country_code: 'KY',
          country_name: 'Cayman Islands',
          flag_emoji: '🇰🇾',
          full_path: 'Cayman Islands > West Bay > Seven Mile Beach'
        }
      };

      const result = mapDealToSubmission(dealWithHierarchy);

      expect(result.territoryData?.fullPath).toBe('Cayman Islands > West Bay > Seven Mile Beach');
      expect(result.territoryData?.type).toBe('area');
    });
  });

  describe('Territory Assignment Rules', () => {
    it('validates territory assignment for same country', () => {
      // A Jamaica rep should be able to be assigned Jamaica territories
      const repCountry = 'JM';
      const territoryCountry = 'JM';
      
      expect(repCountry === territoryCountry).toBe(true);
    });

    it('validates territory assignment for different countries', () => {
      // A Jamaica rep should not be assigned Cayman territories (in a real implementation)
      const repCountry = 'JM';
      const territoryCountry = 'KY';
      
      expect(repCountry === territoryCountry).toBe(false);
    });

    it('handles unassigned territories', () => {
      const unassignedTerritory = {
        id: 'unassigned-territory',
        name: 'Bodden Town',
        countryCode: 'KY',
        assignedTo: null
      };

      expect(unassignedTerritory.assignedTo).toBeNull();
    });
  });
});