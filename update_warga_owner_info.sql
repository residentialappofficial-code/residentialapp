-- Add owner information columns to warga table
ALTER TABLE public.warga ADD COLUMN IF NOT EXISTS nama_pemilik TEXT;
ALTER TABLE public.warga ADD COLUMN IF NOT EXISTS kontak_pemilik TEXT;

-- Update the check constraint to include 'Kosong Dikunjungi' if not already done (re-applying to be safe)
ALTER TABLE public.warga DROP CONSTRAINT IF EXISTS warga_status_hunian_check;
ALTER TABLE public.warga ADD CONSTRAINT warga_status_hunian_check CHECK (status_hunian IN ('Pemilik', 'Kontrak', 'Kosong', 'Kosong Dikunjungi'));
