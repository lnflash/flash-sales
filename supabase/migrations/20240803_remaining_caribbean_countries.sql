-- Phase 8: Add remaining Caribbean countries
-- This migration adds 9 additional Caribbean countries to complete the regional expansion

-- Add new countries
INSERT INTO countries (code, name, local_name, flag_emoji, languages, currency_code, timezone, phone_code) VALUES
-- Tier 1: Major Markets
('TT', 'Trinidad and Tobago', 'Trinidad and Tobago', '🇹🇹', ARRAY['en'], 'TTD', 'America/Port_of_Spain', '+1-868'),
('BB', 'Barbados', 'Barbados', '🇧🇧', ARRAY['en'], 'BBD', 'America/Barbados', '+1-246'),
('BS', 'Bahamas', 'The Bahamas', '🇧🇸', ARRAY['en'], 'BSD', 'America/Nassau', '+1-242'),

-- Tier 2: Growing Markets
('LC', 'Saint Lucia', 'Saint Lucia', '🇱🇨', ARRAY['en'], 'XCD', 'America/St_Lucia', '+1-758'),
('AG', 'Antigua and Barbuda', 'Antigua and Barbuda', '🇦🇬', ARRAY['en'], 'XCD', 'America/Antigua', '+1-268'),
('GD', 'Grenada', 'Grenada', '🇬🇩', ARRAY['en'], 'XCD', 'America/Grenada', '+1-473'),

-- Tier 3: Emerging Markets
('VC', 'Saint Vincent and the Grenadines', 'Saint Vincent and the Grenadines', '🇻🇨', ARRAY['en'], 'XCD', 'America/St_Vincent', '+1-784'),
('DM', 'Dominica', 'Dominica', '🇩🇲', ARRAY['en'], 'XCD', 'America/Dominica', '+1-767'),
('KN', 'Saint Kitts and Nevis', 'Saint Kitts and Nevis', '🇰🇳', ARRAY['en'], 'XCD', 'America/St_Kitts', '+1-869')
ON CONFLICT (code) DO NOTHING;

-- Add territories for Trinidad and Tobago
WITH tt_country AS (
  SELECT id FROM countries WHERE code = 'TT'
)
INSERT INTO territories (country_id, name, type, level, metadata) 
SELECT 
  tt_country.id,
  territory_name,
  'region',
  1,
  jsonb_build_object('population_rank', row_number() OVER (ORDER BY territory_order))
FROM tt_country,
(VALUES 
  ('Port of Spain', 1),
  ('San Fernando', 2),
  ('Chaguanas', 3),
  ('Couva-Tabaquite-Talparo', 4),
  ('Diego Martin', 5),
  ('Princes Town', 6),
  ('Sangre Grande', 7),
  ('San Juan-Laventille', 8),
  ('Siparia', 9),
  ('Tunapuna-Piarco', 10),
  ('Arima', 11),
  ('Point Fortin', 12),
  ('Mayaro-Rio Claro', 13),
  ('Tobago', 14)
) AS territories(territory_name, territory_order);

-- Add territories for Barbados
WITH bb_country AS (
  SELECT id FROM countries WHERE code = 'BB'
)
INSERT INTO territories (country_id, name, type, level, metadata)
SELECT 
  bb_country.id,
  territory_name,
  'parish',
  1,
  jsonb_build_object('island', 'Barbados')
FROM bb_country,
(VALUES 
  ('Christ Church'),
  ('Saint Andrew'),
  ('Saint George'),
  ('Saint James'),
  ('Saint John'),
  ('Saint Joseph'),
  ('Saint Lucy'),
  ('Saint Michael'),
  ('Saint Peter'),
  ('Saint Philip'),
  ('Saint Thomas')
) AS territories(territory_name);

-- Add territories for Bahamas (major islands/districts)
WITH bs_country AS (
  SELECT id FROM countries WHERE code = 'BS'
)
INSERT INTO territories (country_id, name, type, level, metadata)
SELECT 
  bs_country.id,
  territory_name,
  territory_type,
  1,
  jsonb_build_object('island_group', island_group)
FROM bs_country,
(VALUES 
  ('New Providence', 'island', 'Central'),
  ('Grand Bahama', 'island', 'Northern'),
  ('Abaco', 'island', 'Northern'),
  ('Andros', 'island', 'Central'),
  ('Eleuthera', 'island', 'Central'),
  ('Exuma', 'island', 'Central'),
  ('Long Island', 'island', 'Southern'),
  ('Cat Island', 'island', 'Central'),
  ('San Salvador', 'island', 'Central'),
  ('Bimini', 'island', 'Western'),
  ('Berry Islands', 'island', 'Central'),
  ('Harbour Island', 'island', 'Central')
) AS territories(territory_name, territory_type, island_group);

-- Add territories for Saint Lucia
WITH lc_country AS (
  SELECT id FROM countries WHERE code = 'LC'
)
INSERT INTO territories (country_id, name, type, level)
SELECT 
  lc_country.id,
  territory_name,
  'district',
  1
FROM lc_country,
(VALUES 
  ('Castries'),
  ('Gros Islet'),
  ('Vieux Fort'),
  ('Soufrière'),
  ('Dennery'),
  ('Micoud'),
  ('Choiseul'),
  ('Laborie'),
  ('Anse la Raye'),
  ('Canaries')
) AS territories(territory_name);

-- Add territories for Antigua and Barbuda
WITH ag_country AS (
  SELECT id FROM countries WHERE code = 'AG'
)
INSERT INTO territories (country_id, name, type, level, metadata)
SELECT 
  ag_country.id,
  territory_name,
  territory_type,
  1,
  jsonb_build_object('island', island)
FROM ag_country,
(VALUES 
  ('Saint George', 'parish', 'Antigua'),
  ('Saint John', 'parish', 'Antigua'),
  ('Saint Mary', 'parish', 'Antigua'),
  ('Saint Paul', 'parish', 'Antigua'),
  ('Saint Peter', 'parish', 'Antigua'),
  ('Saint Philip', 'parish', 'Antigua'),
  ('Barbuda', 'dependency', 'Barbuda'),
  ('Redonda', 'dependency', 'Redonda')
) AS territories(territory_name, territory_type, island);

-- Add territories for Grenada
WITH gd_country AS (
  SELECT id FROM countries WHERE code = 'GD'
)
INSERT INTO territories (country_id, name, type, level, metadata)
SELECT 
  gd_country.id,
  territory_name,
  'parish',
  1,
  jsonb_build_object('island', island)
FROM gd_country,
(VALUES 
  ('Saint George', 'Grenada'),
  ('Saint John', 'Grenada'),
  ('Saint Mark', 'Grenada'),
  ('Saint Patrick', 'Grenada'),
  ('Saint Andrew', 'Grenada'),
  ('Saint David', 'Grenada'),
  ('Carriacou and Petite Martinique', 'Carriacou')
) AS territories(territory_name, island);

-- Add territories for Saint Vincent and the Grenadines
WITH vc_country AS (
  SELECT id FROM countries WHERE code = 'VC'
)
INSERT INTO territories (country_id, name, type, level)
SELECT 
  vc_country.id,
  territory_name,
  'parish',
  1
FROM vc_country,
(VALUES 
  ('Charlotte'),
  ('Saint Andrew'),
  ('Saint David'),
  ('Saint George'),
  ('Saint Patrick'),
  ('Grenadines')
) AS territories(territory_name);

-- Add territories for Dominica
WITH dm_country AS (
  SELECT id FROM countries WHERE code = 'DM'
)
INSERT INTO territories (country_id, name, type, level)
SELECT 
  dm_country.id,
  territory_name,
  'parish',
  1
FROM dm_country,
(VALUES 
  ('Saint Andrew'),
  ('Saint David'),
  ('Saint George'),
  ('Saint John'),
  ('Saint Joseph'),
  ('Saint Luke'),
  ('Saint Mark'),
  ('Saint Patrick'),
  ('Saint Paul'),
  ('Saint Peter')
) AS territories(territory_name);

-- Add territories for Saint Kitts and Nevis
WITH kn_country AS (
  SELECT id FROM countries WHERE code = 'KN'
)
INSERT INTO territories (country_id, name, type, level, metadata)
SELECT 
  kn_country.id,
  territory_name,
  'parish',
  1,
  jsonb_build_object('island', island)
FROM kn_country,
(VALUES 
  -- Saint Kitts parishes
  ('Christ Church Nichola Town', 'Saint Kitts'),
  ('Saint Anne Sandy Point', 'Saint Kitts'),
  ('Saint George Basseterre', 'Saint Kitts'),
  ('Saint John Capisterre', 'Saint Kitts'),
  ('Saint Mary Cayon', 'Saint Kitts'),
  ('Saint Paul Capisterre', 'Saint Kitts'),
  ('Saint Peter Basseterre', 'Saint Kitts'),
  ('Saint Thomas Middle Island', 'Saint Kitts'),
  ('Trinity Palmetto Point', 'Saint Kitts'),
  -- Nevis parishes
  ('Saint George Gingerland', 'Nevis'),
  ('Saint James Windward', 'Nevis'),
  ('Saint John Figtree', 'Nevis'),
  ('Saint Paul Charlestown', 'Nevis'),
  ('Saint Thomas Lowland', 'Nevis')
) AS territories(territory_name, island);

-- Create indexes for new territories
CREATE INDEX IF NOT EXISTS idx_territories_country_type ON territories(country_id, type);
CREATE INDEX IF NOT EXISTS idx_territories_metadata ON territories USING GIN (metadata);

-- Update territory count for analytics
UPDATE countries 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{territory_count}',
  (SELECT COUNT(*)::text::jsonb FROM territories WHERE territories.country_id = countries.id)
)
WHERE code IN ('TT', 'BB', 'BS', 'LC', 'AG', 'GD', 'VC', 'DM', 'KN');

-- Add comment for documentation
COMMENT ON TABLE countries IS 'Caribbean countries with full regional coverage including Jamaica, Cayman Islands, Curaçao, Trinidad and Tobago, Barbados, Bahamas, and Eastern Caribbean nations';