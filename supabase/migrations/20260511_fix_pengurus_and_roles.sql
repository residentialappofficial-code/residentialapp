-- Perbaikan Error 400 & 403: Pembuatan Tabel Pengurus & Perumahan Roles
-- Silakan jalankan script ini di SQL Editor Supabase Anda

-- 1. Create perumahan_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.perumahan_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create pengurus table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pengurus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warga_id UUID REFERENCES public.warga(id) ON DELETE CASCADE,
    jabatan TEXT NOT NULL,
    periode TEXT,
    perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.perumahan_roles(id) ON DELETE SET NULL,
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memaksa penambahan kolom jika tabelnya sudah ada dari dulu namun kurang kolom
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.perumahan_roles(id) ON DELETE SET NULL;
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS periode TEXT;
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;
ALTER TABLE public.pengurus ADD COLUMN IF NOT EXISTS perumahan_id UUID REFERENCES public.perumahan(id) ON DELETE CASCADE;

-- Segarkan schema cache REST API Supabase (opsional)
NOTIFY pgrst, 'reload schema';

-- 3. Enable RLS and setup policies for perumahan_roles
ALTER TABLE public.perumahan_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.perumahan_roles;
CREATE POLICY "Allow read access to authenticated users" ON public.perumahan_roles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all access to admins" ON public.perumahan_roles;
CREATE POLICY "Allow all access to admins" ON public.perumahan_roles
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Enable RLS and setup policies for pengurus
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.pengurus;
CREATE POLICY "Allow read access to authenticated users" ON public.pengurus
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all access to admins" ON public.pengurus;
CREATE POLICY "Allow all access to admins" ON public.pengurus
    FOR ALL USING (auth.role() = 'authenticated');
