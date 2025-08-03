# Cayman Islands & Curaçao Implementation Guide

## Quick Overview

We're implementing support for **Cayman Islands** and **Curaçao** as proof of concept countries to test the multi-country territory system.

### Why These Countries?

**Cayman Islands** 🇰🇾
- English-speaking (easy transition from Jamaica)
- USD currency (familiar for international business)
- 7 districts across 3 islands
- Major financial center (high-value leads)

**Curaçao** 🇨🇼
- Multi-lingual (Dutch, Papiamento, English)
- Different currency (ANG - Antillean Guilder)
- Different administrative structure
- Tests our localization capabilities

## Database Setup

### 1. Run the Migration
```bash
# Create and run the migration
npx supabase db push

# Verify the data
npx supabase db query "SELECT * FROM countries;"
npx supabase db query "SELECT * FROM territory_hierarchy WHERE country_code IN ('KY', 'CW');"
```

### 2. Territory Structure

**Cayman Islands**:
```
🇰🇾 Cayman Islands
├── Grand Cayman
│   ├── George Town (Capital)
│   │   ├── Camana Bay (Business District)
│   │   ├── Seven Mile Beach (Tourism)
│   │   └── Downtown (Financial)
│   ├── West Bay
│   ├── Bodden Town
│   ├── North Side
│   └── East End
├── Cayman Brac
└── Little Cayman
```

**Curaçao**:
```
🇨🇼 Curaçao
├── Willemstad (Capital)
│   ├── Punda (Business/Historic)
│   ├── Otrobanda (Cultural)
│   ├── Pietermaai (Hotels/Business)
│   └── Scharloo (Commercial)
├── Bandabou (West)
└── Pariba (East)
```

## UI Implementation

### 1. Update Lead Management Page

```tsx
// src/pages/dashboard/leads.tsx
import { CountryToggle } from '@/components/territories/CountrySelector';
import { useCountries } from '@/hooks/useTerritories';

// Add country filter
const { data: countries = [] } = useCountries();
const [selectedCountry, setSelectedCountry] = useState<string>('JM');

// Update the UI
<div className="mb-6">
  <CountryToggle
    countries={countries}
    selectedCountry={selectedCountry}
    onChange={setSelectedCountry}
  />
</div>
```

### 2. Update Territory Dashboard

```tsx
// src/components/sales-intelligence/TerritoryDashboard.tsx
// Modify to support multiple countries
const TerritoryDashboard = ({ countryCode }: { countryCode: string }) => {
  const { territories, level1 } = useCountryTerritories(countryCode);
  
  // Different visualization per country
  if (countryCode === 'JM') {
    return <JamaicaMap territories={level1} />;
  }
  
  if (countryCode === 'KY') {
    return <CaymanIslandsMap territories={level1} />;
  }
  
  if (countryCode === 'CW') {
    return <CuracaoMap territories={level1} />;
  }
  
  // Default grid view
  return <TerritoryGrid territories={level1} />;
};
```

### 3. Update Lead Forms

```tsx
// Update IntakeForm to use new territory selector
import { TerritorySelector } from '@/components/territories/TerritorySelector';

// Replace the old parish dropdown
<TerritorySelector
  value={formData.territory_id}
  onChange={(value) => setFormData({ ...formData, territory_id: value })}
  countryCode={selectedCountry}
  placeholder="Select territory..."
/>
```

## Testing the Implementation

### 1. Create Test Leads

```sql
-- Add Cayman Islands test lead
INSERT INTO deals (
  name, 
  territory_id,
  owner_name,
  interest_level,
  created_at
) VALUES (
  'Cayman Finance Corp',
  (SELECT id FROM territories WHERE country_id = (SELECT id FROM countries WHERE code = 'KY') AND name = 'George Town'),
  'Cayman Finance Corp',
  4,
  NOW()
);

-- Add Curaçao test lead
INSERT INTO deals (
  name,
  territory_id,
  owner_name,
  interest_level,
  created_at
) VALUES (
  'Willemstad Trading NV',
  (SELECT id FROM territories WHERE country_id = (SELECT id FROM countries WHERE code = 'CW') AND name = 'Willemstad'),
  'Willemstad Trading NV',
  3,
  NOW()
);
```

### 2. Assign Reps to Territories

```typescript
// Use the mutation hook
const { mutate: assignTerritory } = useAssignTerritory();

// Assign a rep to George Town
assignTerritory({
  userId: 'rep-user-id',
  territoryId: 'george-town-id',
  role: 'sales_rep',
  isPrimary: true
});
```

### 3. Test Territory Stats

```typescript
// View territory performance
const { data: stats } = useTerritoryStats('george-town-id');
console.log(`George Town: ${stats.leadCount} leads, ${stats.conversionRate}% conversion`);
```

## Currency Handling

### Display Currency
```typescript
import { getCurrencySymbol } from '@/types/territory';

// Cayman Islands (USD)
const caymanSymbol = getCurrencySymbol('USD'); // Returns '$'

// Curaçao (ANG)
const curacaoSymbol = getCurrencySymbol('ANG'); // Returns 'ƒ'
```

### Format Amounts
```typescript
const formatAmount = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
};

// Examples
formatAmount(1000, 'USD'); // "$1,000.00"
formatAmount(1000, 'ANG'); // "ANG 1,000.00"
```

## Language Support (Future)

For Curaçao's multi-language support:
```typescript
// Papiamento translations
const translations = {
  pap: {
    welcome: "Bon bini",
    leads: "Kliente potensial",
    territory: "Teritorio"
  },
  nl: {
    welcome: "Welkom",
    leads: "Leads",
    territory: "Gebied"
  }
};
```

## Rollout Checklist

### Week 1: Foundation
- [x] Create database migration
- [x] Add territory type definitions
- [x] Create country selector component
- [x] Create territory selector component
- [x] Create useTerritories hook

### Week 2: Integration
- [ ] Update lead forms to use territory selector
- [ ] Update lead table to show country flags
- [ ] Update territory dashboard for multiple countries
- [ ] Add country filter to all relevant pages
- [ ] Update reports to handle multiple currencies

### Week 3: Testing & Polish
- [ ] Create test data for both countries
- [ ] Test lead assignment workflow
- [ ] Test territory statistics
- [ ] Test rep assignments
- [ ] Gather user feedback

## Common Issues & Solutions

### Issue: Existing code expects string territories
```typescript
// Add backward compatibility
const getTerritoryName = (lead: any) => {
  if (lead.territory_id && lead.territory) {
    return lead.territory.name;
  }
  return lead.territory || lead.organization?.state_province || '';
};
```

### Issue: Currency display
```typescript
// Add currency to lead display
const LeadCard = ({ lead }) => {
  const currency = lead.territory?.country?.currencyCode || 'JMD';
  const symbol = getCurrencySymbol(currency);
  
  return (
    <div>
      <span>{symbol}{lead.amount}</span>
    </div>
  );
};
```

### Issue: Time zone handling
```typescript
// Use territory timezone
const getLocalTime = (date: string, territory: Territory) => {
  const timezone = territory.country?.timezone || 'America/Jamaica';
  return new Date(date).toLocaleString('en-US', { timeZone: timezone });
};
```

## Next Steps

1. **Immediate**: Test basic functionality with sample data
2. **This Week**: Update all lead-related pages
3. **Next Week**: Add more Caribbean countries
4. **Month 2**: Full localization support

## Support

- Migration issues: Check Supabase logs
- UI issues: Check browser console
- Data issues: Use Supabase dashboard

Remember: Start small, test thoroughly, expand gradually!