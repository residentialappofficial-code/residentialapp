-- REPAIR SCRIPT FOR SIMPERUMAHAN V3 SCHEMA
-- Run this in Supabase SQL Editor to fix 400 Bad Request errors

-- 1. FIX: warga table (Ensure status_hunian constraint and perumahan_id)
DO $$ 
BEGIN
    -- Update status_hunian constraint
    ALTER TABLE public.warga DROP CONSTRAINT IF EXISTS warga_status_hunian_check;
    ALTER TABLE public.warga ADD CONSTRAINT warga_status_hunian_check CHECK (status_hunian IN ('Pemilik', 'Kontrak', 'Kosong'));
    
    -- Add unique constraint for upsert
    ALTER TABLE public.warga DROP CONSTRAINT IF EXISTS warga_blok_perumahan_key;
    ALTER TABLE public.warga ADD CONSTRAINT warga_blok_perumahan_key UNIQUE (perumahan_id, blok);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Warga table already updated or error occurred: %', SQLERRM;
END $$;

-- 2. FIX: keluhan table (Ensure it exists and has correct columns)
CREATE TABLE IF NOT EXISTS public.keluhan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    warga_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    kategori TEXT DEFAULT 'Lainnya',
    deskripsi TEXT NOT NULL,
    foto_url TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure keluhan has perumahan_id column if it already existed
DO $$ 
BEGIN
    ALTER TABLE public.keluhan ADD COLUMN IF NOT EXISTS perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE;
    ALTER TABLE public.keluhan ADD COLUMN IF NOT EXISTS warga_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.keluhan ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Keluhan columns update error: %', SQLERRM;
END $$;

-- 3. FIX: pengurus table
DO $$ 
BEGIN
    ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE;
    ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS warga_id UUID REFERENCES public.warga(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Pengurus columns update error: %', SQLERRM;
END $$;

-- 4. FIX: penggajian table (Modern V3 structure)
DO $$ 
BEGIN
    -- If table is old (missing perumahan_id or pengurus_id), recreate it or migrate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'penggajian' AND column_name = 'perumahan_id') THEN
        -- Rename old table just in case
        ALTER TABLE IF EXISTS public.penggajian RENAME TO penggajian_old;
        
        CREATE TABLE public.penggajian (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
            pengurus_id UUID REFERENCES public.pengurus(id) ON DELETE CASCADE,
            bulan INTEGER NOT NULL,
            tahun INTEGER NOT NULL,
            jumlah BIGINT NOT NULL,
            status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
            created_at TIMESTAMPTZ DEFAULT now()
        );
        RAISE NOTICE 'Penggajian table migrated to V3 structure';
    END IF;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Penggajian migration error: %', SQLERRM;
END $$;

-- 5. ENABLE RLS (Row Level Security)
ALTER TABLE public.keluhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penggajian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- 6. ADD POLICIES (Simple "Allow All" for testing, replace with specific ones later if needed)
DROP POLICY IF EXISTS "Allow all for keluhan" ON public.keluhan;
CREATE POLICY "Allow all for keluhan" ON public.keluhan FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for penggajian" ON public.penggajian;
CREATE POLICY "Allow all for penggajian" ON public.penggajian FOR ALL USING (true);

-- Refresh Schema Cache (Internal Hint)
NOTIFY pgrst, 'reload schema';
