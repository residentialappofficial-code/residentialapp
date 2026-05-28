-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update pakasir settings
INSERT INTO system_settings (key, value, description)
VALUES 
    ('pakasir_slug', '', 'Slug for Pakasir integration (Global)'),
    ('pakasir_api_key', '', 'API Key for Pakasir integration (Global)')
ON CONFLICT (key) DO NOTHING;

-- Remove pakasir columns from iuran_config
ALTER TABLE iuran_config 
DROP COLUMN IF EXISTS pakasir_slug,
DROP COLUMN IF EXISTS pakasir_api_key;
