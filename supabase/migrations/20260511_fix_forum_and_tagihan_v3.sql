-- FIX: forum_posts and tagihan schema for V3 compatibility
-- This migration ensures that the database matches the code expectations

-- 1. FIX: tagihan table
-- Add missing 'keterangan' column used by Bendahara manual input
ALTER TABLE public.tagihan ADD COLUMN IF NOT EXISTS keterangan TEXT;

-- 2. FIX: forum_posts table
-- Ensure it has all columns required by ForumWarga.jsx
DO $$ 
BEGIN
    -- Add perumahan_id for multi-tenancy
    ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE;
    
    -- Add author_id (UUID) to link to profiles
    ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    -- Add kategori (TEXT) and handle legacy 'category' column
    ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS kategori TEXT;
    
    -- If 'category' exists, migrate data and drop it or keep it nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'category') THEN
        UPDATE public.forum_posts SET kategori = category WHERE kategori IS NULL;
    END IF;

    -- Handle legacy 'author' column (make it nullable to avoid constraint errors)
    ALTER TABLE public.forum_posts ALTER COLUMN author DROP NOT NULL;
    
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Forum posts update error: %', SQLERRM;
END $$;

-- 3. FIX: forum_comments table (Ensure it has author_id)
ALTER TABLE public.forum_comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
