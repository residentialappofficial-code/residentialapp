-- Migration: Fix and Standardize Asset Management
-- Date: 2026-05-11

-- 1. Fix aset_komplek table
DO $$ 
BEGIN
    -- Fix name column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aset_komplek' AND column_name = 'nama_alat') THEN
        ALTER TABLE public.aset_komplek RENAME COLUMN nama_alat TO nama_aset;
    END IF;

    -- Fix status column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aset_komplek' AND column_name = 'status_tersedia') THEN
        -- Convert boolean status_tersedia to text status
        ALTER TABLE public.aset_komplek ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';
        UPDATE public.aset_komplek SET status = CASE WHEN status_tersedia = true THEN 'Available' ELSE 'Borrowed' END;
        ALTER TABLE public.aset_komplek DROP COLUMN status_tersedia;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aset_komplek' AND column_name = 'status') THEN
        ALTER TABLE public.aset_komplek ADD COLUMN status TEXT DEFAULT 'Available';
    END IF;

    -- Ensure status column has correct default and check constraint
    ALTER TABLE public.aset_komplek ALTER COLUMN status SET DEFAULT 'Available';
END $$;

-- 2. Fix peminjaman_aset table
ALTER TABLE public.peminjaman_aset 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned')),
ADD COLUMN IF NOT EXISTS keterangan TEXT;

-- Update RLS if needed (already enabled, just ensure policies are okay)
DROP POLICY IF EXISTS "Allow per-perumahan access aset" ON public.aset_komplek;
CREATE POLICY "Allow per-perumahan access aset" ON public.aset_komplek FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow per-perumahan access pinjam" ON public.peminjaman_aset;
CREATE POLICY "Allow per-perumahan access pinjam" ON public.peminjaman_aset FOR ALL USING (true);
