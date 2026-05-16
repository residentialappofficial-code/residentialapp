-- Migration: Add logo, banner, and contact info to perumahan table
-- Date: 2026-05-10

BEGIN;

ALTER TABLE public.perumahan 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS telepon TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Update profiles table to include more descriptive fields if needed
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telepon TEXT,
ADD COLUMN IF NOT EXISTS alamat TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMIT;
