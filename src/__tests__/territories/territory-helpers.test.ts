import { 
  formatTerritoryPath, 
  getCurrencySymbol,
  PROOF_OF_CONCEPT_COUNTRIES 
} from '@/types/territory';

describe('Territory Helper Functions', () => {
  describe('formatTerritoryPath', () => {
    it('formats single level territory correctly', () => {
      const territory = {
        id: '1',
        name: 'Kingston',
        level: 1,
        countryId: 'JM',
        type: 'parish' as const,
        isActive: true
      };

      const result = formatTerritoryPath(territory);
      expect(result).toBe('Kingston');
    });

    it('formats territory with path array correctly', () => {
      const territory = {
        id: '1',
        name: 'New Kingston',
        level: 2,
        countryId: 'JM',
        type: 'area' as const,
        isActive: true,
        path: ['Kingston', 'New Kingston']
      };

      const result = formatTerritoryPath(territory);
      expect(result).toBe('Kingston > New Kingston');
    });

    it('formats territory hierarchy with fullPath correctly', () => {
      const territory = {
        id: '1',
        name: 'Kingston',
        type: 'parish',
        countryCode: 'JM',
        countryName: 'Jamaica',
        flagEmoji: '🇯🇲',
        fullPath: 'Jamaica > Kingston'
      };

      const result = formatTerritoryPath(territory);
      expect(result).toBe('Jamaica > Kingston');
    });
  });


  describe('getCurrencySymbol', () => {
    it('returns correct symbol for JMD', () => {
      expect(getCurrencySymbol('JMD')).toBe('J$');
    });

    it('returns correct symbol for KYD', () => {
      expect(getCurrencySymbol('KYD')).toBe('KYD'); // No symbol defined, returns code
    });

    it('returns correct symbol for ANG', () => {
      expect(getCurrencySymbol('ANG')).toBe('ƒ');
    });

    it('returns correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('returns currency code for unknown currency', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });

    it('returns currency code for undefined input', () => {
      expect(getCurrencySymbol(undefined as any)).toBe(undefined);
    });
  });

  describe('PROOF_OF_CONCEPT_COUNTRIES', () => {
    it('contains exactly 3 countries', () => {
      expect(PROOF_OF_CONCEPT_COUNTRIES).toHaveLength(3);
    });

    it('contains Jamaica', () => {
      const jamaica = PROOF_OF_CONCEPT_COUNTRIES.find(c => c.code === 'JM');
      expect(jamaica).toBeDefined();
      expect(jamaica?.name).toBe('Jamaica');
      expect(jamaica?.flagEmoji).toBe('🇯🇲');
    });

    it('contains Cayman Islands', () => {
      const cayman = PROOF_OF_CONCEPT_COUNTRIES.find(c => c.code === 'KY');
      expect(cayman).toBeDefined();
      expect(cayman?.name).toBe('Cayman Islands');
      expect(cayman?.flagEmoji).toBe('🇰🇾');
    });

    it('contains Curaçao', () => {
      const curacao = PROOF_OF_CONCEPT_COUNTRIES.find(c => c.code === 'CW');
      expect(curacao).toBeDefined();
      expect(curacao?.name).toBe('Curaçao');
      expect(curacao?.flagEmoji).toBe('🇨🇼');
    });
  });
});