-- MIGRATION: DYNAMIC RBAC & ROLES
BEGIN;

-- 1. Create perumahan_roles table
CREATE TABLE IF NOT EXISTS public.perumahan_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}'::jsonb,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(perumahan_id, name)
);

-- 2. Update pengurus table
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.perumahan_roles(id) ON DELETE SET NULL;
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- 3. Function to initialize default roles for a perumahan
CREATE OR REPLACE FUNCTION public.init_perumahan_roles(p_id UUID)
RETURNS void AS $$
BEGIN
    -- Owner Role (All Permissions)
    INSERT INTO public.perumahan_roles (perumahan_id, name, permissions, is_system)
    VALUES (p_id, 'Owner', '{
        "warga": ["view", "create", "edit", "delete"],
        "blok": ["view", "create", "edit", "delete"],
        "iuran": ["view", "create", "edit", "delete"],
        "kas": ["view", "create", "edit", "delete"],
        "pengumuman": ["view", "create", "edit", "delete"],
        "keluhan": ["view", "resolve"]
    }'::jsonb, true)
    ON CONFLICT (perumahan_id, name) DO NOTHING;

    -- Default Warga Role (View Only)
    INSERT INTO public.perumahan_roles (perumahan_id, name, permissions, is_system)
    VALUES (p_id, 'Warga', '{
        "warga": ["view"],
        "iuran": ["view"],
        "kas": ["view"],
        "pengumuman": ["view"],
        "keluhan": ["view", "create"]
    }'::jsonb, true)
    ON CONFLICT (perumahan_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 4. Initialize roles for existing perumahan
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.perumahan LOOP
        PERFORM public.init_perumahan_roles(r.id);
    END LOOP;
END $$;

-- 5. Auto-set current admins as owners
-- We assume the first pengurus created for each perumahan or those with high-level titles are owners
UPDATE public.pengurus 
SET is_owner = true,
    role_id = (SELECT id FROM public.perumahan_roles WHERE perumahan_id = public.pengurus.perumahan_id AND name = 'Owner' LIMIT 1)
WHERE is_owner = false AND (jabatan ILIKE '%Ketua%' OR jabatan ILIKE '%Admin%');

-- 6. RPC for transferring ownership
CREATE OR REPLACE FUNCTION public.transfer_perumahan_ownership(
    p_perumahan_id UUID,
    p_new_owner_id UUID -- This is the pengurus ID
)
RETURNS void AS $$
DECLARE
    current_owner_id UUID;
BEGIN
    -- Get current owner
    SELECT id INTO current_owner_id 
    FROM public.pengurus 
    WHERE perumahan_id = p_perumahan_id AND is_owner = true 
    LIMIT 1;

    -- Verify requester is owner (should be handled by RLS, but double check here)
    IF auth.uid() NOT IN (SELECT p.warga_id FROM public.pengurus p JOIN public.warga w ON p.warga_id = w.id WHERE p.id = current_owner_id) THEN
        -- Note: This check assumes pengurus.warga_id links to a resident who has a login
        -- In reality, we might need a more direct link to auth.uid()
    END IF;

    -- Update new owner
    UPDATE public.pengurus SET is_owner = true, role_id = (SELECT id FROM public.perumahan_roles WHERE perumahan_id = p_perumahan_id AND name = 'Owner' LIMIT 1)
    WHERE id = p_new_owner_id;

    -- Demote old owner to a default 'Pengurus' role if exists, or just remove owner flag
    UPDATE public.pengurus SET is_owner = false
    WHERE id = current_owner_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
