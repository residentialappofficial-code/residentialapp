-- Migration: Add Handover Date and Financial Tracking Columns
-- Run this in your Supabase SQL Editor

-- 1. Add tgl_serah_terima to warga table
ALTER TABLE public.warga 
ADD COLUMN IF NOT EXISTS tgl_serah_terima DATE DEFAULT CURRENT_DATE;

-- 2. Add comment for clarity
COMMENT ON COLUMN public.warga.tgl_serah_terima IS 'Tanggal serah terima unit sebagai basis perhitungan total kewajiban iuran.';

-- 3. Update RLS (if needed) to ensure residents can see this
-- (Assuming existing policy "Allow per-perumahan access warga" covers this)
