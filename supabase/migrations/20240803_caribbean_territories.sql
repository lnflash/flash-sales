-- Caribbean Territory Expansion Migration
-- Adding support for Cayman Islands and Curaçao as proof of concept

-- 1. Create countries table
CREATE TABLE IF NOT EXISTS countries (
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

-- 2. Create territories table with hierarchical structure
CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES territories(id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) NOT NULL,
  level INTEGER NOT NULL, -- 1=District/Parish, 2=Area/Neighborhood
  type VARCHAR(50) NOT NULL, -- 'district', 'parish', 'area', etc.
  code VARCHAR(20), -- Official code if exists
  name VARCHAR(100) NOT NULL,
  local_name VARCHAR(100),
  aliases TEXT[], -- Alternative names/spellings
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_territories_parent ON territories(parent_id);
CREATE INDEX idx_territories_country ON territories(country_id);
CREATE INDEX idx_territories_level ON territories(level);
CREATE INDEX idx_territories_name ON territories(name);
CREATE UNIQUE INDEX idx_territories_unique_code ON territories(country_id, level, code) WHERE code IS NOT NULL;

-- 4. Create territory assignments table
CREATE TABLE IF NOT EXISTS territory_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  territory_id UUID REFERENCES territories(id) NOT NULL,
  role VARCHAR(50) DEFAULT 'sales_rep',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  is_primary BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique active assignments
  UNIQUE(user_id, territory_id, role) WHERE effective_until IS NULL,
  CHECK(effective_until IS NULL OR effective_until > effective_from)
);

CREATE INDEX idx_territory_assignments_user ON territory_assignments(user_id);
CREATE INDEX idx_territory_assignments_territory ON territory_assignments(territory_id);

-- 5. Add territory support to deals table
ALTER TABLE deals 
  ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES territories(id),
  ADD COLUMN IF NOT EXISTS detected_country VARCHAR(2),
  ADD COLUMN IF NOT EXISTS detected_region VARCHAR(100);

-- Create index for territory lookups
CREATE INDEX IF NOT EXISTS idx_deals_territory ON deals(territory_id);

-- 6. Insert countries data
INSERT INTO countries (code, name, local_name, flag_emoji, languages, currency_code, timezone, phone_code) VALUES
  -- Jamaica (existing)
  ('JM', 'Jamaica', 'Jamaica', '🇯🇲', ARRAY['en'], 'JMD', 'America/Jamaica', '+1876'),
  -- Cayman Islands
  ('KY', 'Cayman Islands', 'Cayman Islands', '🇰🇾', ARRAY['en'], 'USD', 'America/Cayman', '+1345'),
  -- Curaçao
  ('CW', 'Curaçao', 'Kòrsou', '🇨🇼', ARRAY['nl', 'pap', 'en'], 'ANG', 'America/Curacao', '+599');

-- 7. Insert Jamaica territories (parishes)
WITH jamaica AS (SELECT id FROM countries WHERE code = 'JM')
INSERT INTO territories (country_id, level, type, code, name) VALUES
  ((SELECT id FROM jamaica), 1, 'parish', 'KIN', 'Kingston'),
  ((SELECT id FROM jamaica), 1, 'parish', 'STA', 'St. Andrew'),
  ((SELECT id FROM jamaica), 1, 'parish', 'STT', 'St. Thomas'),
  ((SELECT id FROM jamaica), 1, 'parish', 'POR', 'Portland'),
  ((SELECT id FROM jamaica), 1, 'parish', 'STM', 'St. Mary'),
  ((SELECT id FROM jamaica), 1, 'parish', 'SAN', 'St. Ann'),
  ((SELECT id FROM jamaica), 1, 'parish', 'TRE', 'Trelawny'),
  ((SELECT id FROM jamaica), 1, 'parish', 'STJ', 'St. James'),
  ((SELECT id FROM jamaica), 1, 'parish', 'HAN', 'Hanover'),
  ((SELECT id FROM jamaica), 1, 'parish', 'WES', 'Westmoreland'),
  ((SELECT id FROM jamaica), 1, 'parish', 'STE', 'St. Elizabeth'),
  ((SELECT id FROM jamaica), 1, 'parish', 'MAN', 'Manchester'),
  ((SELECT id FROM jamaica), 1, 'parish', 'CLA', 'Clarendon'),
  ((SELECT id FROM jamaica), 1, 'parish', 'STC', 'St. Catherine');

-- 8. Insert Cayman Islands territories (districts)
WITH cayman AS (SELECT id FROM countries WHERE code = 'KY')
INSERT INTO territories (country_id, level, type, code, name, metadata) VALUES
  -- Grand Cayman districts
  ((SELECT id FROM cayman), 1, 'district', 'GT', 'George Town', 
    '{"island": "Grand Cayman", "capital": true}'::jsonb),
  ((SELECT id FROM cayman), 1, 'district', 'WB', 'West Bay', 
    '{"island": "Grand Cayman"}'::jsonb),
  ((SELECT id FROM cayman), 1, 'district', 'BT', 'Bodden Town', 
    '{"island": "Grand Cayman"}'::jsonb),
  ((SELECT id FROM cayman), 1, 'district', 'NS', 'North Side', 
    '{"island": "Grand Cayman"}'::jsonb),
  ((SELECT id FROM cayman), 1, 'district', 'EE', 'East End', 
    '{"island": "Grand Cayman"}'::jsonb),
  -- Cayman Brac
  ((SELECT id FROM cayman), 1, 'district', 'CB', 'Cayman Brac', 
    '{"island": "Cayman Brac", "sister_island": true}'::jsonb),
  -- Little Cayman
  ((SELECT id FROM cayman), 1, 'district', 'LC', 'Little Cayman', 
    '{"island": "Little Cayman", "sister_island": true}'::jsonb);

-- 9. Insert key areas for George Town (Cayman's business hub)
WITH george_town AS (
  SELECT id FROM territories 
  WHERE country_id = (SELECT id FROM countries WHERE code = 'KY') 
  AND code = 'GT'
)
INSERT INTO territories (parent_id, country_id, level, type, name, metadata) VALUES
  ((SELECT id FROM george_town), 
   (SELECT id FROM countries WHERE code = 'KY'), 
   2, 'area', 'Camana Bay', 
   '{"business_district": true, "description": "Major business and retail district"}'::jsonb),
  ((SELECT id FROM george_town), 
   (SELECT id FROM countries WHERE code = 'KY'), 
   2, 'area', 'Seven Mile Beach', 
   '{"tourist_area": true, "description": "Hotel and resort district"}'::jsonb),
  ((SELECT id FROM george_town), 
   (SELECT id FROM countries WHERE code = 'KY'), 
   2, 'area', 'Downtown George Town', 
   '{"financial_district": true, "description": "Banking and finance center"}'::jsonb);

-- 10. Insert Curaçao territories
WITH curacao AS (SELECT id FROM countries WHERE code = 'CW')
INSERT INTO territories (country_id, level, type, code, name, local_name, metadata) VALUES
  -- Main districts
  ((SELECT id FROM curacao), 1, 'district', 'WIL', 'Willemstad', 'Willemstad', 
    '{"capital": true, "unesco_heritage": true}'::jsonb),
  ((SELECT id FROM curacao), 1, 'district', 'BAN', 'Bandabou', 'Bandabou', 
    '{"region": "west"}'::jsonb),
  ((SELECT id FROM curacao), 1, 'district', 'PAR', 'Pariba', 'Pariba', 
    '{"region": "east"}'::jsonb);

-- 11. Insert Willemstad neighborhoods (Curaçao's capital)
WITH willemstad AS (
  SELECT id FROM territories 
  WHERE country_id = (SELECT id FROM countries WHERE code = 'CW') 
  AND code = 'WIL'
)
INSERT INTO territories (parent_id, country_id, level, type, name, local_name, metadata) VALUES
  ((SELECT id FROM willemstad), 
   (SELECT id FROM countries WHERE code = 'CW'), 
   2, 'area', 'Punda', 'Punda', 
   '{"historic_center": true, "business_district": true}'::jsonb),
  ((SELECT id FROM willemstad), 
   (SELECT id FROM countries WHERE code = 'CW'), 
   2, 'area', 'Otrobanda', 'Otrobanda', 
   '{"cultural_district": true}'::jsonb),
  ((SELECT id FROM willemstad), 
   (SELECT id FROM countries WHERE code = 'CW'), 
   2, 'area', 'Pietermaai', 'Pietermaai', 
   '{"business_hotels": true}'::jsonb),
  ((SELECT id FROM willemstad), 
   (SELECT id FROM countries WHERE code = 'CW'), 
   2, 'area', 'Scharloo', 'Scharloo', 
   '{"commercial_area": true}'::jsonb);

-- 12. Create view for easy territory lookups
CREATE OR REPLACE VIEW territory_hierarchy AS
WITH RECURSIVE tree AS (
  -- Base case: top-level territories
  SELECT 
    t.id,
    t.parent_id,
    t.country_id,
    t.level,
    t.type,
    t.name,
    t.local_name,
    c.code as country_code,
    c.name as country_name,
    c.flag_emoji,
    ARRAY[t.name] as path,
    t.name as full_path
  FROM territories t
  JOIN countries c ON t.country_id = c.id
  WHERE t.parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case
  SELECT 
    t.id,
    t.parent_id,
    t.country_id,
    t.level,
    t.type,
    t.name,
    t.local_name,
    tree.country_code,
    tree.country_name,
    tree.flag_emoji,
    tree.path || t.name,
    tree.full_path || ' > ' || t.name
  FROM territories t
  JOIN tree ON t.parent_id = tree.id
)
SELECT * FROM tree;

-- 13. Migrate existing Jamaica deals to use territory_id
UPDATE deals d
SET territory_id = t.id
FROM territories t
JOIN countries c ON t.country_id = c.id
WHERE c.code = 'JM' 
  AND t.type = 'parish'
  AND (
    (t.name = d.organization->>'state_province') OR
    (t.name = d.territory)
  )
  AND d.territory_id IS NULL;

-- 14. Create function to get territory stats
CREATE OR REPLACE FUNCTION get_territory_stats(p_territory_id UUID)
RETURNS TABLE (
  lead_count BIGINT,
  active_leads BIGINT,
  conversion_rate NUMERIC,
  avg_interest_level NUMERIC,
  total_reps BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id) as lead_count,
    COUNT(DISTINCT d.id) FILTER (WHERE d.created_at > NOW() - INTERVAL '30 days') as active_leads,
    ROUND(AVG(CASE WHEN d.status = 'won' THEN 100.0 ELSE 0.0 END), 2) as conversion_rate,
    ROUND(AVG(d.interest_level), 2) as avg_interest_level,
    COUNT(DISTINCT ta.user_id) as total_reps
  FROM territories t
  LEFT JOIN deals d ON d.territory_id = t.id
  LEFT JOIN territory_assignments ta ON ta.territory_id = t.id 
    AND ta.effective_until IS NULL
  WHERE t.id = p_territory_id OR t.parent_id = p_territory_id;
END;
$$ LANGUAGE plpgsql;

-- 15. Create RLS policies
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can read territories
CREATE POLICY "Territories are viewable by everyone" ON territories
  FOR SELECT USING (true);

-- Only admins can modify territories
CREATE POLICY "Only admins can modify territories" ON territories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Island Owner')
    )
  );

-- Users can see their own territory assignments
CREATE POLICY "Users can view their assignments" ON territory_assignments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Island Owner')
    )
  );

-- 16. Add helpful comments
COMMENT ON TABLE countries IS 'Supported countries for the sales dashboard';
COMMENT ON TABLE territories IS 'Hierarchical territory structure for each country';
COMMENT ON TABLE territory_assignments IS 'Maps sales reps to their assigned territories';
COMMENT ON COLUMN territories.level IS '1=District/Parish level, 2=Area/Neighborhood level';
COMMENT ON COLUMN territories.metadata IS 'Flexible JSON data specific to each territory';

-- 17. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON territories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territory_assignments_updated_at BEFORE UPDATE ON territory_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();