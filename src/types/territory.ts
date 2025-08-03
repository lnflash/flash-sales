// Territory type definitions for Caribbean expansion

export interface Country {
  id: string;
  code: string; // ISO 3166-1 alpha-2
  name: string;
  localName?: string;
  flagEmoji: string;
  languages: string[];
  currencyCode: string;
  timezone: string;
  phoneCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Territory {
  id: string;
  parentId?: string;
  countryId: string;
  level: number; // 1=District/Parish, 2=Area/Neighborhood
  type: TerritoryType;
  code?: string;
  name: string;
  localName?: string;
  aliases?: string[];
  metadata?: TerritoryMetadata;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  country?: Country;
  parent?: Territory;
  children?: Territory[];
  stats?: TerritoryStats;
  path?: string[]; // Full path from country to this territory
  fullPath?: string; // Human-readable path
}

export type TerritoryType = 
  | 'parish'     // Jamaica
  | 'district'   // Cayman Islands, Curaçao
  | 'area'       // Sub-district level
  | 'region'     // Larger grouping
  | 'island';    // For multi-island nations

export interface TerritoryMetadata {
  island?: string;
  capital?: boolean;
  businessDistrict?: boolean;
  financialDistrict?: boolean;
  touristArea?: boolean;
  culturalDistrict?: boolean;
  unescoHeritage?: boolean;
  description?: string;
  [key: string]: any;
}

export interface TerritoryAssignment {
  id: string;
  userId: string;
  territoryId: string;
  role: TerritoryRole;
  assignedAt: string;
  assignedBy?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  isPrimary: boolean;
  metadata?: Record<string, any>;
  
  // Joined data
  territory?: Territory;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export type TerritoryRole = 'sales_rep' | 'manager' | 'coordinator';

export interface TerritoryStats {
  leadCount: number;
  activeLeads: number; // Last 30 days
  conversionRate: number;
  avgInterestLevel: number;
  totalReps: number;
}

export interface TerritoryFilter {
  countryCode?: string;
  level?: number;
  type?: TerritoryType;
  parentId?: string;
  isActive?: boolean;
  hasReps?: boolean;
  search?: string;
}

export interface TerritoryHierarchy {
  id: string;
  parentId?: string;
  countryId: string;
  level: number;
  type: string;
  name: string;
  localName?: string;
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  path: string[];
  fullPath: string;
}

// Proof of concept countries
export const PROOF_OF_CONCEPT_COUNTRIES: Country[] = [
  {
    id: '', // Will be set by database
    code: 'JM',
    name: 'Jamaica',
    localName: 'Jamaica',
    flagEmoji: '🇯🇲',
    languages: ['en'],
    currencyCode: 'JMD',
    timezone: 'America/Jamaica',
    phoneCode: '+1876',
    createdAt: '',
    updatedAt: ''
  },
  {
    id: '',
    code: 'KY',
    name: 'Cayman Islands',
    localName: 'Cayman Islands',
    flagEmoji: '🇰🇾',
    languages: ['en'],
    currencyCode: 'USD',
    timezone: 'America/Cayman',
    phoneCode: '+1345',
    createdAt: '',
    updatedAt: ''
  },
  {
    id: '',
    code: 'CW',
    name: 'Curaçao',
    localName: 'Kòrsou',
    flagEmoji: '🇨🇼',
    languages: ['nl', 'pap', 'en'],
    currencyCode: 'ANG',
    timezone: 'America/Curacao',
    phoneCode: '+599',
    createdAt: '',
    updatedAt: ''
  }
];

// Territory data for reference
export const TERRITORY_DATA = {
  JM: {
    name: 'Jamaica',
    territories: [
      'Kingston', 'St. Andrew', 'St. Thomas', 'Portland',
      'St. Mary', 'St. Ann', 'Trelawny', 'St. James',
      'Hanover', 'Westmoreland', 'St. Elizabeth', 
      'Manchester', 'Clarendon', 'St. Catherine'
    ]
  },
  KY: {
    name: 'Cayman Islands',
    territories: [
      'George Town', 'West Bay', 'Bodden Town', 
      'North Side', 'East End', 'Cayman Brac', 'Little Cayman'
    ],
    areas: {
      'George Town': ['Camana Bay', 'Seven Mile Beach', 'Downtown George Town']
    }
  },
  CW: {
    name: 'Curaçao',
    territories: ['Willemstad', 'Bandabou', 'Pariba'],
    areas: {
      'Willemstad': ['Punda', 'Otrobanda', 'Pietermaai', 'Scharloo']
    }
  }
};

// Helper to get currency symbol
export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    JMD: 'J$',
    ANG: 'ƒ',
    XCD: 'EC$',
    TTD: 'TT$',
    BBD: 'Bds$',
    EUR: '€'
  };
  return symbols[currencyCode] || currencyCode;
};

// Helper to format territory path
export const formatTerritoryPath = (territory: Territory | TerritoryHierarchy): string => {
  if ('fullPath' in territory) {
    return territory.fullPath;
  }
  
  if ('path' in territory && territory.path) {
    return territory.path.join(' > ');
  }
  
  return territory.name;
};