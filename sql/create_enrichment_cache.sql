-- Create enrichment_cache table for storing API enrichment results
CREATE TABLE IF NOT EXISTS enrichment_cache (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'company', 'person', 'phone', 'address'
    key VARCHAR(255) NOT NULL, -- domain, email, phone number, etc.
    data JSONB NOT NULL, -- Enrichment data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on type and key for fast lookups and preventing duplicates
CREATE UNIQUE INDEX idx_enrichment_cache_type_key ON enrichment_cache(type, key);

-- Create index on timestamp for cache expiration queries
CREATE INDEX idx_enrichment_cache_timestamp ON enrichment_cache(timestamp);

-- Add comment
COMMENT ON TABLE enrichment_cache IS 'Stores cached results from external enrichment APIs to reduce API calls and improve performance';