-- Update status_hunian constraint to include 'Kosong Dikunjungi'
ALTER TABLE public.warga DROP CONSTRAINT IF EXISTS warga_status_hunian_check;
ALTER TABLE public.warga ADD CONSTRAINT warga_status_hunian_check CHECK (status_hunian IN ('Pemilik', 'Kontrak', 'Kosong', 'Kosong Dikunjungi'));
