-- MIGRATION: UNIT-CENTRIC ARCHITECTURE

-- 1. Create Blok Table
CREATE TABLE IF NOT EXISTS public.blok (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    blok_no TEXT NOT NULL,
    luas_tanah INTEGER DEFAULT 0,
    tgl_serah_terima DATE,
    status_hunian TEXT DEFAULT 'Kosong' CHECK (status_hunian IN ('Dihuni', 'Dikontrakkan', 'Kosong', 'Kosong Dikunjungi')),
    nama_pemilik TEXT,
    kontak_pemilik TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(perumahan_id, blok_no)
);

-- 2. Add blok_id and role to warga
ALTER TABLE public.warga ADD COLUMN IF NOT EXISTS blok_id UUID REFERENCES public.blok(id) ON DELETE SET NULL;
ALTER TABLE public.warga ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Penghuni';

-- 3. Populate Blok Table from existing Warga
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warga' AND column_name = 'luas_tanah') THEN
        INSERT INTO public.blok (perumahan_id, blok_no, luas_tanah, status_hunian, nama_pemilik, kontak_pemilik)
        SELECT DISTINCT ON (perumahan_id, blok) 
               perumahan_id, 
               blok as blok_no, 
               luas_tanah, 
               CASE 
                 WHEN status_hunian IN ('Pemilik') THEN 'Dihuni'
                 WHEN status_hunian IN ('Kontrak', 'Pengontrak') THEN 'Dikontrakkan'
                 WHEN status_hunian = 'Kosong Dikunjungi' THEN 'Kosong Dikunjungi'
                 ELSE 'Kosong'
               END as status_hunian, 
               COALESCE(nama_pemilik, CASE WHEN status_hunian = 'Pemilik' THEN nama ELSE NULL END) as nama_pemilik,
               COALESCE(kontak_pemilik, CASE WHEN status_hunian = 'Pemilik' THEN no_hp ELSE NULL END) as kontak_pemilik
        FROM public.warga
        ORDER BY perumahan_id, blok, created_at DESC
        ON CONFLICT (perumahan_id, blok_no) DO NOTHING;
    END IF;
END $$;

-- 4. Link Warga to Blok
UPDATE public.warga w
SET blok_id = b.id
FROM public.blok b
WHERE w.perumahan_id = b.perumahan_id AND w.blok = b.blok_no;

-- 5. Update Warga status labels & Drop Old Columns
ALTER TABLE public.warga DROP CONSTRAINT IF EXISTS warga_status_hunian_check;
-- Set all existing residents to Pemilik or Pengontrak
UPDATE public.warga SET status_hunian = 'Pengontrak' WHERE status_hunian IN ('Kontrak', 'Pengontrak', 'Dikontrakkan');
UPDATE public.warga SET status_hunian = 'Pemilik' WHERE status_hunian NOT IN ('Pengontrak');

ALTER TABLE public.warga ADD CONSTRAINT warga_status_hunian_check 
CHECK (status_hunian IN ('Pemilik', 'Pengontrak'));

-- Drop old columns from warga
ALTER TABLE public.warga DROP COLUMN IF EXISTS luas_tanah;
ALTER TABLE public.warga DROP COLUMN IF EXISTS mulai_iuran;
ALTER TABLE public.warga DROP COLUMN IF EXISTS tgl_mulai;

-- 6. Enable RLS
ALTER TABLE public.blok ENABLE ROW LEVEL SECURITY;

-- 7. Policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.blok;
CREATE POLICY "Enable all for authenticated users" ON public.blok
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

