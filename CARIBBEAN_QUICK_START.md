# Caribbean Territory Expansion - Quick Start Guide

## Immediate Action Items (Week 1)

### Day 1-2: Database Preparation
```bash
# 1. Create migration file
npx supabase migration new caribbean_territories

# 2. Add the migration SQL (see schema in technical guide)

# 3. Run migration locally
npx supabase db push

# 4. Test with sample data
npm run test:territories
```

### Day 3-4: Basic UI Components
Create these files:
- `src/components/territories/TerritorySelector.tsx`
- `src/components/territories/CountrySelector.tsx`  
- `src/types/territory.ts`
- `src/hooks/useTerritories.ts`

### Day 5: Update Existing Code
Files to modify:
- `src/types/submission.ts` - Add territory_id
- `src/pages/dashboard/leads.tsx` - Use new TerritorySelector
- `src/lib/supabase-api.ts` - Update queries for territory_id

## Quick Win Implementation (Week 2)

### 1. Add Trinidad & Tobago
```sql
-- Quick add T&T
INSERT INTO countries (code, name, flag_emoji, languages, currency_code)
VALUES ('TT', 'Trinidad and Tobago', '🇹🇹', ARRAY['en'], 'TTD');

-- Add regions
INSERT INTO territories (country_id, level, type, name) VALUES
  ((SELECT id FROM countries WHERE code = 'TT'), 1, 'region', 'Port of Spain'),
  ((SELECT id FROM countries WHERE code = 'TT'), 1, 'region', 'San Fernando'),
  ((SELECT id FROM countries WHERE code = 'TT'), 1, 'region', 'Chaguanas');
```

### 2. Simple Country Toggle
```tsx
// Add to Lead Management page header
<CountryToggle
  countries={['JM', 'TT']}
  selected={selectedCountry}
  onChange={setSelectedCountry}
/>
```

### 3. Update Territory Dashboard
```tsx
// Modify TerritoryDashboard to show country
{selectedCountry === 'JM' && <JamaicaMap />}
{selectedCountry === 'TT' && <TrinidadMap />}
```

## MVP Features Checklist (Month 1)

### ✅ Phase 1 Deliverables
- [ ] Database schema with countries & territories tables
- [ ] Migration of existing Jamaica data
- [ ] Country selector component
- [ ] Territory hierarchy selector
- [ ] Update lead forms to use new territory system

### ✅ Phase 2 Deliverables  
- [ ] Add 3 more Caribbean countries
- [ ] Basic territory search
- [ ] Territory assignment for reps
- [ ] Territory-based filtering

### ✅ Phase 3 Deliverables
- [ ] Caribbean overview dashboard
- [ ] Country comparison view
- [ ] Territory performance metrics
- [ ] Export territory reports

## Testing Approach

### Manual Test Cases
1. **Jamaica Backward Compatibility**
   - Existing leads still show correct parish
   - Rep assignments still work
   - Reports show historical data

2. **New Country Addition**
   - Can add lead in Trinidad
   - Can assign rep to Trinidad territory
   - Dashboard shows Trinidad data

3. **Cross-Country Operations**
   - Admin can view all countries
   - Can compare Jamaica vs Trinidad
   - Can reassign leads between countries

### Automated Tests
```typescript
// Add to test suite
describe('Caribbean Territories', () => {
  test('Jamaica parishes migrate correctly', async () => {
    const territories = await getTerritoriesByCountry('JM');
    expect(territories).toHaveLength(14);
    expect(territories[0].type).toBe('parish');
  });
  
  test('Can create lead in new country', async () => {
    const lead = await createLead({
      name: 'Test Company',
      territory_id: trinidadPortOfSpain.id
    });
    expect(lead.territory.country).toBe('TT');
  });
});
```

## Common Issues & Solutions

### Issue: Existing code expects parish strings
**Solution**: Add computed field
```sql
ALTER TABLE deals ADD COLUMN territory_name VARCHAR(100) 
  GENERATED ALWAYS AS (
    COALESCE(
      (SELECT name FROM territories WHERE id = territory_id),
      territory
    )
  ) STORED;
```

### Issue: Reports break with null territories
**Solution**: Default to Jamaica
```typescript
const getLeadTerritory = (lead: Lead) => {
  if (lead.territory_id) return lead.territory;
  // Fallback for old data
  return { country: 'JM', name: lead.territory || 'Unknown' };
};
```

### Issue: Performance with territory hierarchy
**Solution**: Use materialized views
```sql
CREATE MATERIALIZED VIEW territory_stats AS
SELECT 
  t.*,
  COUNT(d.id) as lead_count,
  COUNT(ta.user_id) as rep_count
FROM territories t
LEFT JOIN deals d ON d.territory_id = t.id
LEFT JOIN territory_assignments ta ON ta.territory_id = t.id
GROUP BY t.id;

-- Refresh hourly
CREATE INDEX ON territory_stats(country_id, lead_count DESC);
```

## Go-Live Checklist

### Before Launch
- [ ] Backup current database
- [ ] Run migration in staging
- [ ] Test with production data copy
- [ ] Train key users on new features
- [ ] Prepare rollback plan

### Launch Day
- [ ] Run migration during low-traffic window
- [ ] Monitor error logs
- [ ] Verify Jamaica data intact
- [ ] Test critical workflows
- [ ] Announce to users

### Post-Launch  
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Fix any critical issues
- [ ] Plan next country rollout

## Support Resources

### Documentation
- Main roadmap: `/CARIBBEAN_EXPANSION_ROADMAP.md`
- Technical guide: `/docs/TERRITORY_EXPANSION_TECHNICAL.md`
- API reference: `/docs/api/territories.md` (to be created)

### Key Contacts
- Product: Define territory requirements
- Engineering: Implementation support
- Data: Territory data sourcing
- Legal: Compliance requirements

## Next Steps

1. **Today**: Review this guide with team
2. **Tomorrow**: Start database migration
3. **This Week**: Implement basic components
4. **Next Week**: Add first new country
5. **Month 1**: Launch MVP with 3-5 countries

---

Remember: Start small, iterate quickly, and expand gradually. The goal is to prove the concept with 2-3 countries before scaling to the entire Caribbean.