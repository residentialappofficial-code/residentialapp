-- Migration to add Pakasir configuration to iuran_config table
ALTER TABLE iuran_config 
ADD COLUMN IF NOT EXISTS pakasir_slug TEXT,
ADD COLUMN IF NOT EXISTS pakasir_api_key TEXT;

COMMENT ON COLUMN iuran_config.pakasir_slug IS 'habitix';
COMMENT ON COLUMN iuran_config.pakasir_api_key IS 'cuTCvuY8btAUMyaBTtbUfW4gUe5qaxUJ';
