# Technical Implementation Guide: Caribbean Territory Expansion

## Overview
This document provides technical implementation details for expanding the Flash Sales Dashboard to support Caribbean-wide territory management.

## 1. Database Schema Evolution

### Current Schema (Jamaica-only)
```sql
-- Current simple approach
deals.territory = 'Kingston' -- Simple string field
```

### New Hierarchical Schema
```sql
-- Core territory tables
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) UNIQUE NOT NULL, -- ISO 3166-1 alpha-2
  name VARCHAR(100) NOT NULL,
  local_name VARCHAR(100),
  flag_emoji VARCHAR(10),
  languages TEXT[], -- Array of ISO 639-1 codes
  currency_code VARCHAR(3), -- ISO 4217
  timezone VARCHAR(50), -- IANA timezone
  phone_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES territories(id),
  country_id UUID REFERENCES countries(id) NOT NULL,
  level INTEGER NOT NULL, -- 1=Province/State, 2=District, 3=City, etc.
  type VARCHAR(50) NOT NULL, -- 'parish', 'province', 'department', 'district', etc.
  code VARCHAR(20), -- Official administrative code
  name VARCHAR(100) NOT NULL,
  local_name VARCHAR(100),
  aliases TEXT[], -- Alternative names/spellings
  bounds JSONB, -- GeoJSON boundaries (optional)
  metadata JSONB, -- Flexible additional data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_territories_parent (parent_id),
  INDEX idx_territories_country (country_id),
  INDEX idx_territories_level (level),
  INDEX idx_territories_name (name),
  UNIQUE(country_id, level, code) WHERE code IS NOT NULL
);

-- Materialized path for fast hierarchy queries
CREATE TABLE territory_paths (
  territory_id UUID PRIMARY KEY REFERENCES territories(id),
  path UUID[], -- Array of ancestor IDs
  depth INTEGER,
  full_path TEXT, -- Human-readable path like "Jamaica/Kingston/New Kingston"
  
  INDEX idx_territory_paths_path (path),
  INDEX idx_territory_paths_depth (depth)
);

-- Territory assignments for sales reps
CREATE TABLE territory_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  territory_id UUID REFERENCES territories(id) NOT NULL,
  role VARCHAR(50) DEFAULT 'sales_rep', -- 'sales_rep', 'manager', 'coordinator'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_primary BOOLEAN DEFAULT true,
  metadata JSONB,
  
  -- Constraints
  UNIQUE(user_id, territory_id, role) WHERE effective_until IS NULL,
  CHECK(effective_until IS NULL OR effective_until > effective_from)
);

-- Update deals table
ALTER TABLE deals 
  ADD COLUMN territory_id UUID REFERENCES territories(id),
  ADD COLUMN detected_country VARCHAR(2), -- For IP-based detection
  ADD COLUMN detected_region VARCHAR(100);

-- Migration helper
UPDATE deals d
SET territory_id = t.id
FROM territories t
JOIN countries c ON t.country_id = c.id
WHERE c.code = 'JM' 
  AND t.name = d.territory 
  AND t.level = 1;
```

### Sample Data Structure
```sql
-- Example: Jamaica
INSERT INTO countries (code, name, flag_emoji, languages, currency_code, timezone, phone_code)
VALUES ('JM', 'Jamaica', '🇯🇲', ARRAY['en'], 'JMD', 'America/Jamaica', '+1876');

-- Kingston Parish
INSERT INTO territories (country_id, level, type, name, code)
VALUES (
  (SELECT id FROM countries WHERE code = 'JM'),
  1, 'parish', 'Kingston', 'KIN'
);

-- New Kingston District
INSERT INTO territories (parent_id, country_id, level, type, name)
VALUES (
  (SELECT id FROM territories WHERE code = 'KIN'),
  (SELECT id FROM countries WHERE code = 'JM'),
  2, 'district', 'New Kingston'
);
```

## 2. API Design

### Territory Service APIs
```typescript
// GET /api/territories/countries
interface CountryResponse {
  countries: Array<{
    id: string;
    code: string;
    name: string;
    flagEmoji: string;
    languages: string[];
    currencyCode: string;
    territoryCount: number;
  }>;
}

// GET /api/territories/tree?country=JM
interface TerritoryTreeResponse {
  country: Country;
  territories: TerritoryNode[];
}

interface TerritoryNode {
  id: string;
  name: string;
  type: string;
  level: number;
  stats: {
    leadCount: number;
    repCount: number;
    conversionRate: number;
  };
  children: TerritoryNode[];
}

// GET /api/territories/search?q=kingston
interface TerritorySearchResponse {
  results: Array<{
    id: string;
    name: string;
    fullPath: string;
    country: string;
    matchType: 'exact' | 'fuzzy' | 'alias';
  }>;
}

// POST /api/territories/assign
interface AssignTerritoryRequest {
  userId: string;
  territoryId: string;
  role?: 'sales_rep' | 'manager' | 'coordinator';
  effectiveFrom?: string; // ISO date
  effectiveUntil?: string; // ISO date
}
```

## 3. React Component Architecture

### Core Territory Components
```typescript
// components/territories/TerritoryProvider.tsx
interface TerritoryContextValue {
  countries: Country[];
  currentCountry: Country | null;
  currentTerritory: Territory | null;
  territories: Territory[];
  loading: boolean;
  setCountry: (countryCode: string) => void;
  setTerritory: (territoryId: string) => void;
  searchTerritories: (query: string) => Promise<Territory[]>;
}

// components/territories/TerritorySelector.tsx
interface TerritorySelectorProps {
  value?: string | string[];
  onChange: (territoryId: string | string[]) => void;
  multiple?: boolean;
  showCountrySelector?: boolean;
  maxLevel?: number;
  placeholder?: string;
  showStats?: boolean;
}

// Example usage
<TerritorySelector
  value={selectedTerritory}
  onChange={handleTerritoryChange}
  showCountrySelector
  showStats
  placeholder="Select territory..."
/>

// components/territories/TerritoryMap.tsx
interface TerritoryMapProps {
  countryCode: string;
  selectedTerritories?: string[];
  onTerritoryClick?: (territoryId: string) => void;
  showHeatmap?: boolean;
  metric?: 'leads' | 'conversion' | 'revenue';
}

// components/territories/TerritoryBreadcrumb.tsx
interface TerritoryBreadcrumbProps {
  territoryId: string;
  onNavigate?: (territoryId: string) => void;
  showFlag?: boolean;
  maxItems?: number;
}
```

### Enhanced Territory Dashboard
```typescript
// components/territories/CaribbeanDashboard.tsx
interface CaribbeanDashboardProps {
  view: 'map' | 'grid' | 'list';
  metric: 'leads' | 'reps' | 'conversion' | 'revenue';
  dateRange: DateRange;
}

// Caribbean overview with drill-down capability
const CaribbeanDashboard = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  
  return (
    <div className="caribbean-dashboard">
      {/* Country-level view */}
      {!selectedCountry && (
        <CountryGrid
          countries={caribbeanCountries}
          onCountryClick={setSelectedCountry}
          metric={currentMetric}
        />
      )}
      
      {/* Country detail view */}
      {selectedCountry && (
        <CountryTerritoryView
          countryCode={selectedCountry}
          level={selectedLevel}
          onLevelChange={setSelectedLevel}
          onBack={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
};
```

## 4. Territory Routing Engine

### Lead Assignment Algorithm
```typescript
interface TerritoryRule {
  id: string;
  priority: number;
  conditions: RuleCondition[];
  action: RuleAction;
}

interface RuleCondition {
  field: 'postalCode' | 'city' | 'phone' | 'language' | 'ip';
  operator: 'equals' | 'contains' | 'startsWith' | 'inRadius';
  value: string | number;
}

interface RuleAction {
  type: 'assign' | 'pool' | 'escalate';
  territoryId?: string;
  userId?: string;
  poolId?: string;
}

class TerritoryRouter {
  async routeLead(lead: Lead): Promise<RoutingResult> {
    // 1. Detect territory from lead data
    const detectedTerritory = await this.detectTerritory(lead);
    
    // 2. Find applicable rules
    const rules = await this.findMatchingRules(lead, detectedTerritory);
    
    // 3. Apply highest priority rule
    const rule = rules.sort((a, b) => b.priority - a.priority)[0];
    
    // 4. Execute routing action
    return this.executeRule(rule, lead);
  }
  
  private async detectTerritory(lead: Lead): Promise<Territory | null> {
    // Try multiple detection methods in order
    const detectors = [
      this.detectByPostalCode,
      this.detectByPhone,
      this.detectByIP,
      this.detectByExplicitSelection
    ];
    
    for (const detector of detectors) {
      const territory = await detector(lead);
      if (territory) return territory;
    }
    
    return null;
  }
}
```

## 5. Localization Implementation

### i18n Setup
```typescript
// lib/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      territories: {
        selectCountry: "Select Country",
        selectTerritory: "Select Territory",
        allTerritories: "All Territories",
        noTerritoriesFound: "No territories found",
        leadCount: "{{count}} leads",
        conversionRate: "{{rate}}% conversion"
      }
    }
  },
  es: {
    translation: {
      territories: {
        selectCountry: "Seleccionar País",
        selectTerritory: "Seleccionar Territorio",
        allTerritories: "Todos los Territorios",
        noTerritoriesFound: "No se encontraron territorios",
        leadCount: "{{count}} clientes potenciales",
        conversionRate: "{{rate}}% de conversión"
      }
    }
  },
  fr: {
    translation: {
      territories: {
        selectCountry: "Sélectionner le Pays",
        selectTerritory: "Sélectionner le Territoire",
        allTerritories: "Tous les Territoires",
        noTerritoriesFound: "Aucun territoire trouvé",
        leadCount: "{{count}} prospects",
        conversionRate: "Taux de conversion {{rate}}%"
      }
    }
  }
};

// Detect user's preferred language
const detectLanguage = () => {
  const saved = localStorage.getItem('language');
  if (saved) return saved;
  
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'es', 'fr', 'nl'].includes(browserLang) ? browserLang : 'en';
};
```

## 6. Performance Optimizations

### Caching Strategy
```typescript
// lib/cache/territoryCache.ts
class TerritoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 3600000; // 1 hour
  
  async getCountries(): Promise<Country[]> {
    const key = 'countries';
    const cached = this.get(key);
    if (cached) return cached;
    
    const countries = await fetchCountries();
    this.set(key, countries);
    return countries;
  }
  
  async getTerritoryTree(countryCode: string): Promise<TerritoryNode> {
    const key = `tree:${countryCode}`;
    const cached = this.get(key);
    if (cached) return cached;
    
    const tree = await fetchTerritoryTree(countryCode);
    this.set(key, tree);
    return tree;
  }
  
  invalidateCountry(countryCode: string) {
    // Clear all cache entries for a country
    Array.from(this.cache.keys())
      .filter(key => key.includes(countryCode))
      .forEach(key => this.cache.delete(key));
  }
}

// Optimized territory queries
const optimizedQueries = {
  // Use materialized views for performance
  getTerritoryStats: `
    SELECT 
      t.id,
      t.name,
      COUNT(DISTINCT d.id) as lead_count,
      COUNT(DISTINCT ta.user_id) as rep_count,
      AVG(CASE WHEN d.status = 'won' THEN 1 ELSE 0 END) * 100 as conversion_rate
    FROM territories t
    LEFT JOIN territory_paths tp ON t.id = tp.territory_id
    LEFT JOIN deals d ON d.territory_id = ANY(tp.path)
    LEFT JOIN territory_assignments ta ON ta.territory_id = ANY(tp.path)
    WHERE t.country_id = $1
    GROUP BY t.id, t.name
  `,
  
  // Use recursive CTE for hierarchy
  getTerritoryHierarchy: `
    WITH RECURSIVE territory_tree AS (
      SELECT id, parent_id, name, level, 0 as depth
      FROM territories
      WHERE country_id = $1 AND parent_id IS NULL
      
      UNION ALL
      
      SELECT t.id, t.parent_id, t.name, t.level, tt.depth + 1
      FROM territories t
      JOIN territory_tree tt ON t.parent_id = tt.id
    )
    SELECT * FROM territory_tree
    ORDER BY depth, name
  `
};
```

## 7. Migration Strategy

### Phased Migration Approach
```typescript
// scripts/migrate-territories.ts
class TerritoryMigration {
  async phase1_CreateSchema() {
    // Create new tables without affecting existing system
    await this.createTerritoryTables();
    await this.createIndexes();
  }
  
  async phase2_ImportJamaica() {
    // Import existing Jamaica data
    const jamaicaParishes = [
      'Kingston', 'St. Andrew', 'St. Thomas', 'Portland',
      'St. Mary', 'St. Ann', 'Trelawny', 'St. James',
      'Hanover', 'Westmoreland', 'St. Elizabeth', 
      'Manchester', 'Clarendon', 'St. Catherine'
    ];
    
    const jamaica = await this.createCountry('JM', 'Jamaica');
    for (const parish of jamaicaParishes) {
      await this.createTerritory(jamaica.id, 1, 'parish', parish);
    }
  }
  
  async phase3_MigrateDeals() {
    // Update deals to use new territory_id
    await this.db.query(`
      UPDATE deals d
      SET territory_id = t.id
      FROM territories t
      JOIN countries c ON t.country_id = c.id
      WHERE c.code = 'JM' 
        AND t.name = d.territory 
        AND d.territory_id IS NULL
    `);
  }
  
  async phase4_AddNewCountries() {
    // Incrementally add other Caribbean countries
    const countries = [
      { code: 'TT', name: 'Trinidad and Tobago' },
      { code: 'BB', name: 'Barbados' },
      { code: 'BS', name: 'Bahamas' },
      // ... more countries
    ];
    
    for (const country of countries) {
      await this.importCountryTerritories(country);
    }
  }
}
```

## 8. Testing Strategy

### Territory System Tests
```typescript
// __tests__/territories/TerritoryRouter.test.ts
describe('TerritoryRouter', () => {
  it('should route Jamaican leads to correct parish', async () => {
    const lead = {
      phoneNumber: '+18765551234', // Kingston number
      city: 'Kingston'
    };
    
    const result = await router.routeLead(lead);
    expect(result.territory.name).toBe('Kingston');
    expect(result.territory.country).toBe('JM');
  });
  
  it('should handle cross-border leads', async () => {
    const lead = {
      phoneNumber: '+18685551234', // Trinidad number
      preferredLanguage: 'en'
    };
    
    const result = await router.routeLead(lead);
    expect(result.territory.country).toBe('TT');
  });
  
  it('should fall back to country-level pool', async () => {
    const lead = {
      country: 'BB',
      city: 'Unknown City'
    };
    
    const result = await router.routeLead(lead);
    expect(result.poolId).toBe('barbados-general');
  });
});
```

## 9. Monitoring & Analytics

### Territory Performance Metrics
```typescript
interface TerritoryMetrics {
  // Real-time metrics
  activeLeads: number;
  activeReps: number;
  todayConversions: number;
  
  // Historical metrics
  leadTrend: TrendData;
  conversionTrend: TrendData;
  revenueTrend: TrendData;
  
  // Comparative metrics
  rankInCountry: number;
  rankInRegion: number;
  performanceIndex: number; // 0-100 score
}

// Monitoring setup
const territoryMonitoring = {
  // CloudWatch metrics
  metrics: [
    'territory.lead.created',
    'territory.lead.assigned',
    'territory.lead.converted',
    'territory.routing.success',
    'territory.routing.failure'
  ],
  
  // Alerts
  alerts: [
    {
      name: 'UnassignedTerritory',
      condition: 'territory.reps.count == 0',
      threshold: '5 minutes'
    },
    {
      name: 'HighLeadBacklog',
      condition: 'territory.leads.unassigned > 50',
      threshold: '15 minutes'
    }
  ]
};
```

## 10. Future Enhancements

### AI-Powered Territory Optimization
```typescript
interface TerritoryOptimization {
  // Suggestions based on ML analysis
  suggestedBoundaryChanges: BoundaryChange[];
  suggestedRepReallocation: RepAllocation[];
  predictedImpact: {
    leadCoverage: number;
    conversionRate: number;
    responseTime: number;
  };
}

// Virtual territories based on criteria
interface VirtualTerritory {
  name: string;
  criteria: {
    industries?: string[];
    companySize?: Range;
    leadScore?: Range;
    languages?: string[];
  };
  assignedReps: string[];
}
```

---

This technical guide provides the foundation for implementing a robust, scalable Caribbean-wide territory management system. Each component is designed to handle the complexity of multi-country operations while maintaining performance and usability.